import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef } from "ag-grid-community";
import { Role } from "chipster-js-common";
import log from "loglevel";
import { forkJoin, of } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../model/loadstate";
import { BytesPipe } from "../../../shared/pipes/bytes.pipe";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";

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
    { field: "username", sortable: true, filter: true },
    { field: "readWriteSessions", sortable: true },
    { field: "readOnlySessions", sortable: true },
    {
      field: "size",
      sortable: true,
      valueFormatter: (params) => this.bytesPipe.transform(params.value, 0) as string,
    },
  ];

  rowSelection = "single";

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
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    this.userSessionsState = new LoadState(State.Loading);
    this.users = [];
    this.quotasMap = new Map();

    let sessionDbUrl: string;
    let sessionDbAdminUrl: string;
    // check if its working properly
    this.configService
      .getInternalService(Role.SESSION_DB, this.tokenService.getToken())
      .pipe(
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
            const url = sessionDbAdminUrl + "/admin/users/" + encodeURIComponent(user) + "/quota";
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
      )
      .subscribe({
        next: (quotas) => {
          quotas.forEach((quota) => this.quotasMap.set(quota.username, quota));
          this.rowData = quotas;
          this.allSessionsState = LoadState.Ready;
        },
        error: (err) => this.restErrorService.showError("get quotas failed", err),
      });
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
          this.authHttpClient.getAuth(service.adminUri + "/admin/users/" + encodeURIComponent(user) + "/sessions")
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
    const username = $event.api.getSelectedNodes()[0]?.data?.username;
    if (username != null) {
      this.selectUser(username);
    }
  }
}
