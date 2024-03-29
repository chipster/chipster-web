import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef, GridApi, GridOptions, GridReadyEvent } from "ag-grid-community";
import { Role } from "chipster-js-common";
import log from "loglevel";
import { forkJoin } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { AuthenticationService } from "../../../core/authentication/authentication-service";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../model/loadstate";
import { BytesPipe } from "../../../shared/pipes/bytes.pipe";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import { SessionDbAdminService } from "../../../shared/services/sessiondb-admin.service";
import { UserService } from "../../../shared/services/user.service";
import UtilsService from "../../../shared/utilities/utils";
import { DialogModalService } from "../../sessions/session/dialogmodal/dialogmodal.service";
import { AgBtnCellRendererComponent } from "./ag-btn-cell-renderer.component";
import { ConfirmDeleteModalComponent, DeleteAction } from "./confirm-delete-modal/confirm-delete-modal.component";

@Component({
  selector: "ch-storage",
  templateUrl: "./storage.component.html",
  styleUrls: ["./storage.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})

/**
 * For this class:
 *
 * userId: auth/username
 *
 * For example:
 * userId: jaas/demo
 * auth: jaas
 * username: demo
 *
 * In backend databases (auth, sessiondb) this may not be the case.
 *
 */
export class StorageComponent implements OnInit {
  quotasMap: Map<string, any>;

  public combinedGridOptions: GridOptions;
  public combinedGridReady = false;
  public authOnlyGridOptions: GridOptions;
  public authOnlyGridReady = false;
  public sessionDbOnlyGridOptions: GridOptions;
  public sessionDbOnlyGridReady = false;

  public authOnlyGridApi: GridApi<any>;
  public sessionDbOnlyGridApi: GridApi<any>;
  public combinedGridApi: GridApi<any>;

  public showSessionNames = false;

  private fieldUserId: ColDef = {
    field: "userId",
    sortable: true,
    filter: true,
    pinned: "left",
    filterParams: {
      maxNumConditions: 10000, // needed for the list filter
    },
  };
  private fieldUsername: ColDef = { field: "user", sortable: true, filter: true };
  private fieldAuth: ColDef = { field: "auth", sortable: true, filter: true };
  private fieldName: ColDef = { field: "name", sortable: true, filter: true };
  private fieldMail: ColDef = { field: "mail", sortable: true, filter: true };
  private fieldCreated: ColDef = {
    field: "created",
    sortable: true,
    filter: "agDateColumnFilter",
    cellRenderer: this.customDateRenderer.bind(this),
  };
  private fieldModified: ColDef = {
    field: "modified",
    sortable: true,
    filter: "agDateColumnFilter",
    cellRenderer: this.customDateRenderer.bind(this),
  };
  private fieldReadWriteSessions: ColDef = {
    field: "readWriteSessions",
    headerName: "Sessions RW",
    sortable: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    // resizable: true,
    type: "rightAligned",
  };
  private fieldReadOnlySessions: ColDef = {
    field: "readOnlySessions",
    headerName: "Sessions RO",
    sortable: true,
    type: "numericColumn",
  };
  private fieldSize: ColDef = {
    field: "size",
    sortable: true,
    valueFormatter: (params) => this.bytesPipe.transform(params.value, 0) as string,
    type: "numericColumn",
  };
  private fieldActions: ColDef = {
    field: "actions",
    width: 290,
    // resizable: true,
    pinned: "right",
    cellRenderer: AgBtnCellRendererComponent,
  };

  combinedColumnDefs: ColDef[] = [
    this.fieldUserId,
    this.fieldName,
    this.fieldMail,
    this.fieldCreated,
    this.fieldModified,
    this.fieldReadWriteSessions,
    this.fieldReadOnlySessions,
    this.fieldSize,
    {
      ...this.fieldActions,
      cellRendererParams: {
        onShowSessions: this.onShowSessions.bind(this),
        onDeleteSessions: this.onDeleteSingleUsersSessions.bind(this),
        onDeleteUser: this.onDeleteSingleUser.bind(this),
        onDeleteUserAndSessions: this.onDeleteSingleUserAndSessions.bind(this),
      },
    },
  ];

  authOnlyColumnDefs: ColDef[] = [
    this.fieldUserId,
    this.fieldAuth,
    this.fieldUsername,
    this.fieldName,
    this.fieldMail,
    this.fieldCreated,
    this.fieldModified,
    {
      ...this.fieldActions,
      cellRendererParams: {
        onDeleteUser: this.onDeleteSingleUser.bind(this),
      },
    },
  ];

  sessionDbOnlyColumnDefs: ColDef[] = [
    this.fieldUserId,
    this.fieldReadWriteSessions,
    this.fieldReadOnlySessions,
    this.fieldSize,
    {
      ...this.fieldActions,
      cellRendererParams: {
        onShowSessions: this.onShowSessions.bind(this),
        onDeleteSessions: this.onDeleteSingleUsersSessions.bind(this),
      },
    },
  ];

  public rowSelection: "single" | "multiple" = "single";

  public combinedUsers = [];
  public authOnlyUsers = [];
  public sessionDbOnlyUsers = [];

  selectedUser: string;
  sessions: any[];

  public allSessionsState: LoadState = new LoadState(State.Loading);
  public userSessionsState: LoadState = new LoadState(State.Loading);

  public listFilterVisible = false;
  public listFilterText = "";

  @ViewChild("modalContent") modalContent: any;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private modalService: NgbModal,
    private bytesPipe: BytesPipe,
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private sessionDbAdminService: SessionDbAdminService,
  ) {}

  ngOnInit() {
    this.refresh();
  }

  private refresh() {
    this.allSessionsState = new LoadState(State.Loading);
    this.userSessionsState = new LoadState(State.Loading);

    this.combinedGridReady = false;
    this.authOnlyGridReady = false;
    this.sessionDbOnlyGridReady = false;

    this.combinedUsers = [];
    this.authOnlyUsers = [];
    this.sessionDbOnlyUsers = [];

    this.sessions = [];
    this.quotasMap = new Map();

    const authUsers$ = this.authenticationService.getUsers();

    const sessionDbUsers$ = this.sessionDbAdminService.getQuotas();

    forkJoin([authUsers$, sessionDbUsers$]).subscribe({
      next: ([authUsers, sessionDbUsers]) => {
        const sessionDbNullUsers = sessionDbUsers.filter((user) => user.userId == null);
        if (sessionDbNullUsers.length > 0) {
          log.warn("sessionDb has", sessionDbNullUsers.length, "null userIds", sessionDbNullUsers);
        }

        const sessionDbTrimUsers = sessionDbUsers.filter((user) => user.userId !== user.userId?.trim());
        if (sessionDbTrimUsers.length > 0) {
          log.warn("sessionDb has", sessionDbTrimUsers.length, "userIds that need trimming", sessionDbTrimUsers);
        }

        sessionDbUsers.forEach((quota) => this.quotasMap.set(quota.userId, quota));

        // sessionDbUsers to a set
        const sessionDbUsersSet = new Set();
        sessionDbUsers.forEach((sessionDbUser) => {
          sessionDbUsersSet.add(sessionDbUser.userId);
        });

        // authUsers to a set
        const authUsersSet = new Set();
        authUsers.forEach((authUser) => {
          authUsersSet.add(authUser.auth + "/" + authUser.username);
        });

        // sessionDbUsers to a map
        const sessionDbUsersMap = new Map();
        sessionDbUsers.forEach((sessionDbUser) => {
          sessionDbUsersMap.set(sessionDbUser.userId, sessionDbUser);
        });

        // authUsers to a map
        const authUsersMap = new Map();
        authUsers.forEach((authUser) => {
          authUsersMap.set(authUser.auth + "/" + authUser.username, authUser);
        });

        // get intersection of both sets
        const intersection = new Set([...sessionDbUsersSet].filter((x) => authUsersSet.has(x)));

        // get difference of both sets
        const inSessionDbNotAuth = [...sessionDbUsersSet]
          .filter((x) => !authUsersSet.has(x))
          .map((userId) => sessionDbUsersMap.get(userId));

        const inAuthNotSessionDb = [...authUsersSet]
          .filter((x) => !sessionDbUsersSet.has(x))
          .map((userId) => authUsersMap.get(userId));

        const combinedUsers = sessionDbUsers
          .filter((sessionDbUser) => intersection.has(sessionDbUser.userId))
          .map((sessionDbUser) =>
            // combine sessionDbUser properties and corresponding authUser properties
            // both have username so order matters!
            ({
              ...authUsersMap.get(sessionDbUser.userId),
              ...sessionDbUser,
              user: authUsersMap.get(sessionDbUser.userId).username,
              modified: UtilsService.stringToDateKeepNull(authUsersMap.get(sessionDbUser.userId).modified),
              created: UtilsService.stringToDateKeepNull(authUsersMap.get(sessionDbUser.userId).created),
            }),
          );

        this.combinedUsers = combinedUsers;
        this.authOnlyUsers = inAuthNotSessionDb.map((authUser) => ({
          ...authUser,
          user: authUser.username,
          userId: authUser.auth + "/" + authUser.username,
        }));
        this.sessionDbOnlyUsers = inSessionDbNotAuth;

        // grid options
        const commonOptions = { suppressRowClickSelection: true, suppressCellFocus: true };

        this.combinedGridOptions = {
          ...commonOptions,
          ...{
            rowData: this.combinedUsers,
            columnDefs: this.combinedColumnDefs,
            onGridReady: (event: GridReadyEvent) => {
              this.combinedGridReady = true;
              this.combinedGridApi = event.api;
            },
            onGridPreDestroyed: () => {
              this.combinedGridReady = false;
            },
            onFilterChanged: this.onFilterChanged.bind(this),
          },
        };

        this.authOnlyGridOptions = {
          ...commonOptions,
          ...{
            rowData: this.authOnlyUsers,
            columnDefs: this.authOnlyColumnDefs,
            rowSelection: this.rowSelection,
            onGridReady: (event: GridReadyEvent) => {
              this.authOnlyGridReady = true;
              this.authOnlyGridApi = event.api;
            },
            onGridPreDestroyed: () => {
              this.authOnlyGridReady = false;
            },
          },
        };

        this.sessionDbOnlyGridOptions = {
          ...commonOptions,
          ...{
            rowData: this.sessionDbOnlyUsers,
            columnDefs: this.sessionDbOnlyColumnDefs,
            rowSelection: this.rowSelection,
            onGridReady: (event: GridReadyEvent) => {
              this.sessionDbOnlyGridReady = true;
              this.sessionDbOnlyGridApi = event.api;
            },
            onGridPreDestroyed: () => {
              this.sessionDbOnlyGridReady = false;
            },
          },
        };

        this.allSessionsState = LoadState.Ready;
      },
      error: (err) => this.restErrorService.showError("get users and quotas failed", err),
    });
  }

  onClearFilters(gridApi: GridApi) {
    gridApi.setFilterModel(null);
  }

  onSelectOldGuests(gridApi: GridApi) {
    const now = new Date();

    // 3 months ago
    const limitTimestamp = now.getTime() - 3 * 31 * 24 * 60 * 60 * 1000;
    const limitDate = new Date(limitTimestamp);

    const oldGuestsConditions = {
      type: "lessThan",
      dateFrom: UtilsService.renderDate(limitDate),
    };

    const oldGuestsFilter = {
      userId: { type: "startsWith", filter: "jaas/guest" },
      modified: oldGuestsConditions,
    };
    gridApi.setFilterModel(oldGuestsFilter);
  }

  onToggleListFilter() {
    this.listFilterVisible = !this.listFilterVisible;
  }

  onFilterListed(gridApi: GridApi) {
    const userIds = this.parseListFilter(this.listFilterText);
    const conditions = userIds.map((userId) => ({ filterType: "text", type: "equals", filter: userId }));

    const userListFilter = {
      userId: {
        filterType: "text",
        operator: "OR",
        conditions,
      },
    };
    gridApi.setFilterModel(userListFilter);
  }

  onShowSessions(event) {
    this.selectUser(event.userId);
  }

  onDeleteUsers(users: any[]) {
    this.deleteUsers(...users);
  }

  onDeleteSessions(users: any[]) {
    this.deleteSessions(...users);
  }

  onDeleteUsersAndSessions(users: any[]) {
    this.deleteUserAndSessions(...users);
  }

  onDeleteSingleUserAndSessions(user: any) {
    this.deleteUserAndSessions(user);
  }

  onDeleteSingleUser(user: any) {
    this.deleteUsers(user);
  }

  onDeleteSingleUsersSessions(user: any) {
    this.deleteSessions(user);
  }

  onFilterChanged(): void {
    // Handle filter change here
  }

  private deleteSessions(...users: any[]) {
    this.openConfirmModal(DeleteAction.DeleteSessions, users).subscribe({
      next: (result) => {
        if (result) {
          this.refresh();
        }
      },
    });
  }

  private deleteUserAndSessions(...users: any[]) {
    this.openConfirmModal(DeleteAction.DeleteUserAndSessions, users).subscribe({
      next: (result) => {
        if (result) {
          this.refresh();
        }
      },
    });
  }

  private deleteUsers(...users: any) {
    this.openConfirmModal(DeleteAction.DeleteUser, users).subscribe({
      next: (result) => {
        if (result) {
          this.refresh();
        }
      },
    });
  }

  private selectUser(user: string) {
    this.modalService.open(this.modalContent, { size: "xl" });

    this.selectedUser = user;
    this.userSessionsState = new LoadState(State.Loading);
    this.sessions = [];

    this.configService
      .getInternalService(Role.SESSION_DB, this.tokenService.getToken())
      .pipe(
        mergeMap((service) =>
          this.authHttpClient.getAuth(service.adminUri + "/admin/users/sessions?userId=" + encodeURIComponent(user)),
        ),
      )
      .subscribe(
        (result: any[]) => {
          this.sessions = result[0]?.sessions;
          this.userSessionsState = new LoadState(State.Ready);
        },
        (err) => this.restErrorService.showError("get quotas failed", err),
      );
  }

  getFilteredCount(gridApi: GridApi): number {
    return gridApi.getDisplayedRowCount();
  }

  /**
   * The grid api doesn't have a method to get the filtered rows.
   *
   * @param gridApi
   * @returns
   */
  public getFilteredRows(gridApi: GridApi): any[] {
    const rows = [];
    gridApi.forEachNodeAfterFilter((node) => {
      rows.push(node.data);
    });
    return rows;
  }

  customDateRenderer(params: any): string {
    return UtilsService.renderDate(params.value);
  }

  getFilteredTotalSize(gridApi: GridApi): number {
    return this.getFilteredRows(gridApi).reduce((total, user) => total + user.size, 0);
  }

  getUsername(userId: string): string {
    let username;
    try {
      username = this.authenticationService.getUsername(userId);
    } catch (err) {
      username = userId;
    }
    return username;
  }

  private parseListFilter(listFilterText: string): string[] {
    // split by new line
    const lines = listFilterText.split("\n");

    // split by comma and only keep the first part
    const userIds = lines.map((line) => line.split(",")[0]);

    // trim each userId
    const trimmedUserIds = userIds.map((userId) => userId.trim());

    // remove empty userIds
    const nonEmptyUserIds = trimmedUserIds.filter((userId) => userId.length > 0);

    return nonEmptyUserIds;
  }

  private getFilteredUserIds(gridApi: GridApi): string[] {
    const rows = this.getFilteredRows(gridApi);
    return rows.map((row) => row.userId);
  }

  private openConfirmModal(deleteAction: DeleteAction, users: any[]) {
    const modalRef = this.modalService.open(ConfirmDeleteModalComponent, { size: "lg", backdrop: "static" });
    modalRef.componentInstance.deleteAction = deleteAction;
    modalRef.componentInstance.users = users;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }
}
