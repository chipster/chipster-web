import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef, GridOptions } from "ag-grid-community";
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
import { UserService } from "../../../shared/services/user.service";
import { AgBtnCellRendererComponent } from "./ag-btn-cell-renderer.component";

@Component({
  selector: "ch-storage",
  templateUrl: "./storage.component.html",
  styleUrls: ["./storage.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class StorageComponent implements OnInit {
  quotasMap: Map<string, any>;

  public combinedUsersGridOptions: GridOptions;
  public combinedUsersGridReady = false;

  private fieldUsername: ColDef = {
    field: "username",
    sortable: true,
    filter: true,
    pinned: "left",
  };
  private fieldUser: ColDef = { field: "user", sortable: true, filter: true };
  private fieldAuth: ColDef = { field: "auth", sortable: true, filter: true };
  private fieldCreated: ColDef = { field: "created", sortable: true, filter: true };
  private fieldModified: ColDef = { field: "modified", sortable: true, filter: true };

  private fieldReadWriteSessions: ColDef = {
    field: "readWriteSessions",
    headerName: "Sessions RW",
    sortable: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    resizable: true,
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
  };
  private fieldActions: ColDef = {
    field: "actions",
    resizable: true,
    pinned: "right",
    cellRenderer: AgBtnCellRendererComponent,
  };

  combinedUsersColumnDefs: ColDef[] = [
    this.fieldUsername,
    this.fieldCreated,
    this.fieldModified,
    this.fieldReadWriteSessions,
    this.fieldReadOnlySessions,
    this.fieldSize,
    {
      ...this.fieldActions,
      cellRendererParams: {
        onSessions: this.onSessions.bind(this),
        onDeleteSessions: this.onDeleteSessions.bind(this),
        onDelete: this.onDeleteUser.bind(this),
      },
    },
  ];

  authOnlyUsersColumnDefs: ColDef[] = [
    this.fieldAuth,
    this.fieldUsername,
    this.fieldCreated,
    this.fieldModified,
    {
      ...this.fieldActions,
      cellRendererParams: {
        onDelete: this.onDeleteUser.bind(this),
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
        onSessions: this.onSessions.bind(this),
        onDeleteSessions: this.onDeleteSessions.bind(this),
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
    private userService: UserService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  private refresh() {
    this.allSessionsState = new LoadState(State.Loading);
    this.userSessionsState = new LoadState(State.Loading);

    this.combinedUsersGridReady = false;

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

    console.log("sessionDbUsers$", sessionDbUsers$);

    forkJoin([authUsers$, sessionDbUsers$]).subscribe({
      next: ([authUsers, sessionDbUsers]) => {
        console.log("authUsers", authUsers);
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
        this.combinedUsersGridOptions = {
          rowData: this.combinedUsers,
          columnDefs: this.combinedUsersColumnDefs,

          rowSelection: this.rowSelection,

          // EVENTS
          // Add event handlers
          onRowClicked: (event) => console.log("A row was clicked"),
          onColumnResized: (event) => console.log("A column was resized"),
          onGridReady: (event) => {
            console.log("The grid is now ready");
            this.combinedUsersGridReady = true;
          },
          onGridPreDestroyed: (event) => {
            console.log("The grid pre destroyed");
            this.combinedUsersGridReady = false;
          },

          // CALLBACKS
          getRowHeight: (params) => 25,
        };

        this.allSessionsState = LoadState.Ready;
      },
      error: (err) => this.restErrorService.showError("get users and quotas failed", err),
    });
  }

  onDeleteMultipleUsers(event) {
    console.log("delete multiple users", event);
  }

  onDeleteUser(event) {
    const username = event.username;
    console.log("delete user", username);

    const users: string[] = [username, username];

    this.userService.deleteUser(...users).subscribe({
      next: (res) => {
        console.log("delete user", username, "done");
        console.log(res);
        this.refresh();
      },
      error: (err) => this.restErrorService.showError("Delete user " + username + " failed", err),
    });
  }

  onDeleteSessions(event) {
    const username = event.username;
    console.log("delete sessions for", username);

    this.configService
      .getAdminUri(Role.SESSION_DB)
      .pipe(
        mergeMap((sessionDbAdminUrl: string) => {
          const url = sessionDbAdminUrl + "/admin/users/sessions?userId=" + encodeURIComponent(username);
          return this.authHttpClient.deleteAuth(url);
        })
      )
      .subscribe({
        next: (res) => {
          console.log("delete sessions for", username, "done");
          console.log(res);
          this.refresh();
        },
        error: (err) => this.restErrorService.showError("Delete sessions for " + username + " failed", err),
      });

    //   mergeMap(() => this.configService.getSessionDbUrl()),
    //   tap((url) => {
    //     sessionDbUrl = url;
    //   }),
    //   mergeMap(() => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
    //   tap((users: string[]) => {
    //     // FIXME use this instead of getting auth users above
    //     this.users = users;
    //   }),
    //   mergeMap((users: string[]) => {
    //     const userQuotas$ = users.map((user: string) => {
    //       const url = sessionDbAdminUrl + "/admin/users/quota?userId=" + encodeURIComponent(user);
    //       return this.authHttpClient.getAuth(url).pipe(
    //         catchError((err) => {
    //           log.error("quota request error", err);
    //           // don't cancel other requests even if one of them fails
    //           return of({
    //             username: user,
    //           });
    //         })
    //       );
    //     });
    //     return forkJoin(userQuotas$);
    //   })
    // );
  }

  onSessions(event) {
    this.selectUser(event.username);
  }

  selectUser(user: string) {
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

  getFilteredCount(): number {
    // console.log(this.combinedUsersGridOptions.api);

    return this.combinedUsersGridOptions.api.getDisplayedRowCount();
    // return 0;
  }

  onSelectionChanged($event) {
    // const username = $event.api.getSelectedNodes()[0]?.data?.username;
    // if (username != null) {
    //   this.selectUser(username);
    // }
  }
}
