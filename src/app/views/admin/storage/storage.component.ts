import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef, GridApi, GridOptions } from "ag-grid-community";
import { Role } from "chipster-js-common";
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
import { ConfirmDeleteModalComponent } from "./confirm-delete-modal/confirm-delete-modal.component";

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

  private fieldUserId: ColDef = {
    field: "userId",
    sortable: true,
    filter: true,
    pinned: "left",
  };
  private fieldUsername: ColDef = { field: "user", sortable: true, filter: true };
  private fieldAuth: ColDef = { field: "auth", sortable: true, filter: true };
  private fieldName: ColDef = { field: "name", sortable: true, filter: true };
  private fieldMail: ColDef = { field: "mail", sortable: true, filter: true };
  private fieldCreated: ColDef = {
    field: "created",
    sortable: true,
    filter: true,
    cellRenderer: this.customDateRenderer.bind(this),
  };
  private fieldModified: ColDef = {
    field: "modified",
    sortable: true,
    filter: true,
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
    private sessionDbAdminService: SessionDbAdminService
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

    const sessionDbUsers$ = this.configService.getSessionDbUrl().pipe(
      mergeMap((sessionDbUrl) => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
      mergeMap((users: string[]) =>
        this.sessionDbAdminService.getQuotas(...users.filter((user) => user == null || user === "null"))
      )
    );

    forkJoin([authUsers$, sessionDbUsers$]).subscribe({
      next: ([authUsers, sessionDbUsers]) => {
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
            })
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

            // rowSelection: this.rowSelection,

            onGridReady: (params) => {
              // params.columnApi.autoSizeAllColumns();
              this.combinedGridReady = true;
            },
            onGridPreDestroyed: () => {
              this.combinedGridReady = false;
            },
            onFilterChanged: this.onFilterChanged.bind(this),

            // getRowHeight: (params) => 25,
          },
        };

        this.authOnlyGridOptions = {
          ...commonOptions,
          ...{
            rowData: this.authOnlyUsers,
            columnDefs: this.authOnlyColumnDefs,
            rowSelection: this.rowSelection,
            onGridReady: (params) => {
              // params.columnApi.autoSizeAllColumns();
              this.authOnlyGridReady = true;
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
            onGridReady: (params) => {
              // params.columnApi.autoSizeAllColumns();
              this.sessionDbOnlyGridReady = true;
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
      userId: { type: "startsWith", filter: "jaas/UnitTest" },
      created: oldGuestsConditions,
    };
    gridApi.setFilterModel(oldGuestsFilter);
  }

  onShowSessions(event) {
    this.selectUser(event.userId);
  }

  onDeleteUsers(users: any[]) {
    this.combinedGridOptions.columnApi.autoSizeAllColumns();

    this.deleteUsers(...users);
  }

  onDeleteSessions(users: any[]) {
    this.deleteSessions(...users);
  }

  onDeleteUsersAndSessions(users: any[]) {
    this.deleteSessions(...users);
    this.deleteUsers(...users);
  }

  onDeleteSingleUser(user: any) {
    this.deleteUsers(user);
  }

  onDeleteSingleUsersSessions(user: any) {
    this.deleteSessions(user);
  }

  onFilterChanged(params: any): void {
    // Handle filter change here
  }

  deleteSessions(...users: any[]) {
    const userIds: string[] = users.map((user) => user.userId);

    this.openConfirmModal(
      "Delete sessions",
      "Are you sure you want to delete all sessions for " + users.length + " user" + UtilsService.sIfMany(users) + "?",
      users
    ).subscribe({
      next: () => {
        this.sessionDbAdminService.deleteSessions(...userIds).subscribe({
          next: (res) => {
            this.refresh();
          },
          error: (err) => this.restErrorService.showError("Delete sessions failed", err),
        });
      },
    });
  }

  private deleteUsers(...users: any) {
    const userIds: string[] = users.map((user) => user.userId);

    this.openConfirmModal(
      "Delete users",
      "Are you sure you want to delete the following " + users.length + " user" + UtilsService.sIfMany(users) + "?",
      users
    ).subscribe({
      next: () => {
        this.userService.deleteUser(...userIds).subscribe({
          next: () => {
            this.refresh();
          },
          error: (err) => this.restErrorService.showError("Delete users failed", err),
        });
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
          this.authHttpClient.getAuth(service.adminUri + "/admin/users/sessions?userId=" + encodeURIComponent(user))
        )
      )
      .subscribe(
        (result: any[]) => {
          this.sessions = result[0]?.sessions;
          this.userSessionsState = new LoadState(State.Ready);
        },
        (err) => this.restErrorService.showError("get quotas failed", err)
      );
  }

  getFilteredCount(gridApi: GridApi): number {
    return gridApi.getDisplayedRowCount();
  }

  /**
   * For some reason the grid api doesn't have a method to get the filtered rows.
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

  private getFilteredUserIds(gridApi: GridApi): string[] {
    const rows = this.getFilteredRows(gridApi);
    return rows.map((row) => row.userId);
  }

  private openConfirmModal(title, message, users: any[]) {
    const modalRef = this.modalService.open(ConfirmDeleteModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.users = users;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }
}
