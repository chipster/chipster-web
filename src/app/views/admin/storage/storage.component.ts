import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef, GridApi, GridOptions } from "ag-grid-community";
import { Role } from "chipster-js-common";
import log from "loglevel";
import { forkJoin, of } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
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
export class StorageComponent implements OnInit {
  quotasMap: Map<string, any>;

  public combinedGridOptions: GridOptions;
  public combinedGridReady = false;
  public authOnlyGridOptions: GridOptions;
  public authOnlyGridReady = false;
  public sessionDbOnlyGridOptions: GridOptions;
  public sessionDbOnlyGridReady = false;

  private fieldUsername: ColDef = {
    field: "username",
    sortable: true,
    filter: true,
    pinned: "left",
  };
  private fieldUser: ColDef = { field: "user", sortable: true, filter: true };
  private fieldAuth: ColDef = { field: "auth", sortable: true, filter: true };
  private fieldName: ColDef = { field: "name", sortable: true, filter: true };
  private fieldEmail: ColDef = { field: "email", sortable: true, filter: true };
  private fieldCreated: ColDef = { field: "created", sortable: true, filter: true };
  private fieldModified: ColDef = { field: "modified", sortable: true, filter: true };

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
    // width: 290,
    // resizable: true,
    pinned: "right",
    cellRenderer: AgBtnCellRendererComponent,
  };

  combinedColumnDefs: ColDef[] = [
    this.fieldUsername,
    this.fieldName,
    this.fieldEmail,
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
    this.fieldAuth,
    this.fieldUsername,
    this.fieldName,
    this.fieldEmail,
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
    this.fieldUsername,
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

    let sessionDbUrl: string;
    let sessionDbAdminUrl: string;
    // check if its working properly
    const sessionDbUsers$ = this.configService.getAdminUri(Role.SESSION_DB).pipe(
      tap((uri: string) => {
        sessionDbAdminUrl = uri;
      }),
      mergeMap(() => this.configService.getSessionDbUrl()),
      tap((url) => {
        sessionDbUrl = url;
      }),
      mergeMap(() => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
      mergeMap((users: string[]) => {
        const userQuotas$ = users.map((user: string) => {
          const url = sessionDbAdminUrl + "/admin/users/quota?userId=" + encodeURIComponent(user);
          return this.authHttpClient.getAuth(url).pipe(
            catchError((err) => {
              log.error("quota request error", err);
              // don't cancel other requests even if one of them fails
              return of({
                username: user,
              });
            })
          );
        });

        // just returning [] messes up the forkJoin later on
        return userQuotas$ == null || userQuotas$.length === 0 ? of([]) : forkJoin(userQuotas$);
      })
    );

    forkJoin([authUsers$, sessionDbUsers$]).subscribe({
      next: ([authUsers, sessionDbUsers]) => {
        sessionDbUsers.forEach((quota) => this.quotasMap.set(quota.username, quota));

        // sessionDbUsers to a set
        const sessionDbUsersSet = new Set();
        sessionDbUsers.forEach((sessionDbUser) => {
          sessionDbUsersSet.add(sessionDbUser.username);
        });

        // authUsers to a set
        const authUsersSet = new Set();
        authUsers.forEach((authUser) => {
          authUsersSet.add(authUser.auth + "/" + authUser.username);
        });

        // sessionDbUsers to a map
        const sessionDbUsersMap = new Map();
        sessionDbUsers.forEach((sessionDbUser) => {
          sessionDbUsersMap.set(sessionDbUser.username, sessionDbUser);
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
          .map((username) => sessionDbUsersMap.get(username));

        const inAuthNotSessionDb = [...authUsersSet]
          .filter((x) => !sessionDbUsersSet.has(x))
          .map((username) => authUsersMap.get(username));
        console.log(sessionDbUsersMap);
        console.log("sessiondb not auth", inSessionDbNotAuth);
        console.log("auth not sessiondb", inAuthNotSessionDb);

        const combinedUsers = sessionDbUsers
          .filter((sessionDbUser) => intersection.has(sessionDbUser.username))
          .map((sessionDbUser) =>
            // combine sessionDbUser properties and corresponding authUser properties
            // both have username so order matters!
            ({
              ...authUsersMap.get(sessionDbUser.username),
              ...sessionDbUser,
              user: authUsersMap.get(sessionDbUser.username).username,
              modified: new Date(authUsersMap.get(sessionDbUser.username).modified),
              created: new Date(authUsersMap.get(sessionDbUser.username).created),
            })
          );

        this.combinedUsers = combinedUsers;
        this.authOnlyUsers = inAuthNotSessionDb.map((authUser) => ({
          ...authUser,
          user: authUser.username,
          username: authUser.auth + "/" + authUser.username,
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

  onShowSessions(event) {
    this.selectUser(event.username);
  }

  onDeleteUsers(users: any[]) {
    this.combinedGridOptions.columnApi.autoSizeAllColumns();

    this.deleteUsers(...users);
  }

  onDeleteSessions(users: any[]) {
    console.log("delete sessions");
    this.deleteSessions(...users);
  }

  onDeleteUsersAndSessions(users: any[]) {
    this.deleteSessions(...users);
    this.deleteUsers(...users);
    console.log("delete users and sessions");
  }

  onDeleteSingleUser(user: any) {
    const username = user.username;
    console.log("on delete single user", username);
    this.deleteUsers(user);
  }

  onDeleteSingleUsersSessions(user: any) {
    this.deleteSessions(user);
  }

  deleteSessions(...users: any[]) {
    const userIds: string[] = users.map((user) => user.username);

    this.openConfirmModal(
      "Delete sessions",
      "Are you sure you want to delete all sessions for " + users.length + " user" + UtilsService.sIfMany(users) + "?",
      users
    ).subscribe({
      next: () => {
        console.log("delete sessions confirmed");

        this.sessionDbAdminService.deleteSessions(...userIds).subscribe({
          next: (res) => {
            console.log("delete sessions done");
            console.log(res);
            this.refresh();
          },
          error: (err) => this.restErrorService.showError("Delete sessions failed", err),
        });
      },
    });
  }

  private deleteUsers(...users: any) {
    const userIds: string[] = users.map((user) => user.username);

    this.openConfirmModal(
      "Delete users",
      "Are you sure you want to delete the following " + users.length + " user" + UtilsService.sIfMany(users) + "?",
      users
    ).subscribe({
      next: (res) => {
        console.log("delete confirmed", res);

        this.userService.deleteUser(...userIds).subscribe({
          next: (res) => {
            console.log("delete users done");
            console.log(res);
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
        (sessions: any[]) => {
          console.log("sessions", sessions);
          this.sessions = sessions;
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

  private getFilteredUserIds(gridApi: GridApi): string[] {
    const rows = this.getFilteredRows(gridApi);
    return rows.map((row) => row.username);
  }

  private openConfirmModal(title, message, users: any[]) {
    const modalRef = this.modalService.open(ConfirmDeleteModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.users = users;
    return DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result);
  }
}
