import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef } from "ag-grid-community";
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
import { AgBtnCellRendererComponent } from "./ag-btn-cell-renderer.component";

@Component({
  selector: "ch-storage",
  templateUrl: "./storage.component.html",
  styleUrls: ["./storage.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class StorageComponent implements OnInit {
  users: string[];
  quotasMap: Map<string, any>;

  columnDefs: ColDef[] = [
    { field: "username", sortable: true, filter: true, pinned: "left" },
    { field: "user", sortable: true, filter: true },
    { field: "auth", sortable: true, filter: true },
    { field: "created", sortable: true, filter: true },
    { field: "modified", sortable: true, filter: true },
    {
      field: "readWriteSessions",
      headerName: "Sessions RW",
      sortable: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      resizable: true,
      type: "rightAligned",
    },
    { field: "readOnlySessions", headerName: "Sessions RO", sortable: true, type: "numericColumn" },
    {
      field: "size",
      sortable: true,
      valueFormatter: (params) => this.bytesPipe.transform(params.value, 0) as string,
    },
    {
      field: "actions",
      pinned: "right",
      cellRenderer: AgBtnCellRendererComponent,
      cellRendererParams: {
        onSessions: this.onSessions.bind(this),
        onDelete: this.onDeleteUser.bind(this),
      },
    },
  ];

  public rowSelection: "single" | "multiple" = "single";

  rowData = [];

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
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit() {
    this.userSessionsState = new LoadState(State.Loading);
    this.users = [];
    this.quotasMap = new Map();

    const authUsers$ = this.authenticationService.getUsers();

    let sessionDbUrl: string;
    let sessionDbAdminUrl: string;
    // check if its working properly
    const sessionDbUsers$ = this.configService.getInternalService(Role.SESSION_DB, this.tokenService.getToken()).pipe(
      tap((service) => {
        sessionDbAdminUrl = service.adminUri;
      }),
      mergeMap(() => this.configService.getSessionDbUrl()),
      tap((url) => {
        sessionDbUrl = url;
      }),
      mergeMap(() => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
      tap((users: string[]) => {
        this.users = users;
      }),
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
        return forkJoin(userQuotas$);
      })
    );
    // sessionDbUsers$.subscribe({
    //   next: (quotas) => {
    //     quotas.forEach((quota) => this.quotasMap.set(quota.username, quota));
    //     this.rowData = quotas;
    //     this.allSessionsState = LoadState.Ready;
    //   },
    //   error: (err) => this.restErrorService.showError("get quotas failed", err),
    // });

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
        const difference = new Set([...sessionDbUsersSet].filter((x) => !authUsersSet.has(x)));

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

        const missingUsers = [];
        sessionDbUsers.forEach((sessionDbUser) => {});
        this.rowData = combinedUsers;
        this.allSessionsState = LoadState.Ready;
      },
      error: (err) => this.restErrorService.showError("get users and quotas failed", err),
    });
  }

  onDeleteUser(event) {
    console.log("delete user", event);
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
          this.sessions = sessions;
          this.userSessionsState = new LoadState(State.Ready);
        },
        (err) => this.restErrorService.showError("get quotas failed", err)
      );
  }

  onSelectionChanged($event) {
    // const username = $event.api.getSelectedNodes()[0]?.data?.username;
    // if (username != null) {
    //   this.selectUser(username);
    // }
  }
}
