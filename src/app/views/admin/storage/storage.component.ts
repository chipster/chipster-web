import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ColDef } from "ag-grid-community";
import { Role } from "chipster-js-common";
import log from "loglevel";
import { EMPTY, forkJoin } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../model/loadstate";
import { BytesPipe } from "../../../shared/pipes/bytes.pipe";
import { SessionResource } from "../../../shared/resources/session.resource";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import { BtnCellRendererComponent } from "./btn-cell-renderer.component";

@Component({
  selector: "ch-storage",
  templateUrl: "./storage.component.html",
  styleUrls: ["./storage.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class StorageComponent implements OnInit {
  users: string[];
  quotasMap: Map<string, any>;

  rowData = [];
  columnDefs: ColDef[] = [
    {
      field: "username",
      sortable: true,
      filter: true,
      pinned: "left",
      cellRenderer: "btnCellRenderer",
      cellRendererParams: {
        onClick: this.onSelectUser.bind(this),
        userNameAsLabel: true,
        getTargetValue: this.getUsername.bind(this),
      },
    },
    { field: "readWriteSessions", sortable: true },
    { field: "readOnlySessions", sortable: true },
    {
      field: "size",
      sortable: true,
      valueFormatter: (params) => this.bytesPipe.transform(params.value, 0) as string,
    },
    {
      field: "actions",
      // pinned: "right",
      cellRenderer: "btnCellRenderer",
      cellRendererParams: {
        onClick: this.onDelete.bind(this),
        label: "Delete",
        getTargetValue: this.getUsername.bind(this),
      },
    },
  ];

  userSessionsRowData = [];
  userSessionsColumnDefs: ColDef[] = [
    // FIXME remove this field
    { field: "name", sortable: true },
    {
      field: "size",
      sortable: true,
      valueFormatter: (params) => this.bytesPipe.transform(params.value, 0) as string,
    },
    { field: "datasetCount", sortable: true },
    { field: "jobCount", sortable: true },
    { field: "inputCount", sortable: true },
    { field: "parameterCount", sortable: true },
    { field: "metadataCount", sortable: true },
    { field: "sessionId", sortable: true },
    {
      field: "actions",
      pinned: "right",
      cellRenderer: "btnCellRenderer",
      cellRendererParams: {
        onClick: this.onDeleteSession.bind(this),
        label: "Delete",
        getTargetValue: this.getSessionId.bind(this),
      },
    },
  ];

  frameworkComponents = {
    btnCellRenderer: BtnCellRendererComponent,
  };

  rowSelection = "single";

  selectedUser: string;

  public allSessionsState: LoadState = new LoadState(State.Loading);
  public userSessionsState: LoadState = new LoadState(State.Loading);

  @ViewChild("modalContent") modalContent: any;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private modalService: NgbModal,
    private bytesPipe: BytesPipe,
    private sessionResource: SessionResource
  ) {}

  ngOnInit() {
    this.users = [];
    this.quotasMap = new Map();

    // get users and quota for each user
    this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap((sessionDbUrl: string) => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
        tap((users: string[]) => {
          this.users = users;
        }),
        mergeMap(() => this.configService.getAdminUri(Role.SESSION_DB)),
        mergeMap((sessionDbAdminUrl: string) => {
          const userQuotas$ = this.users.map((user: string) =>
            this.authHttpClient.getAuth(sessionDbAdminUrl + "/admin/users/" + encodeURIComponent(user) + "/quota").pipe(
              catchError((err) => {
                log.error("quota request error", err);
                // don't cancel other requests even if one of them fails
                return EMPTY;
              })
            )
          );
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
    this.userSessionsState = new LoadState(State.Loading);
    this.selectedUser = user;
    this.userSessionsRowData = [];

    this.modalService.open(this.modalContent, { size: "xl" });

    this.configService
      .getAdminUri(Role.SESSION_DB)
      .pipe(
        mergeMap((url) => this.authHttpClient.getAuth(url + "/admin/users/" + encodeURIComponent(user) + "/sessions"))
      )
      .subscribe(
        (sessions: any[]) => {
          this.userSessionsRowData = sessions;
          this.userSessionsState = new LoadState(State.Ready);
        },
        (err) => this.restErrorService.showError("get quotas failed", err)
      );
  }

  onDelete(userId: string) {
    console.log("delete sessions for user", userId);
    this.sessionResource.deleteSessionsForUser(userId).subscribe({
      next: () => {
        console.log("delete sessions for user response");
      },
    });
  }

  onDeleteSession(sessionId: string) {
    console.log("delete session", sessionId, "for user", this.selectedUser);
    this.sessionResource.deleteRulesForUser(sessionId, this.selectedUser).subscribe({
      next: () => {
        console.log("delete response");
      },
    });
  }

  onSelectUser(event) {
    this.selectUser(event);
  }

  private getUsername(params) {
    return params.data.username;
  }

  private getSessionId(params) {
    return params.data.sessionId;
  }

  // onSelectionChanged($event) {
  //   const username = $event.api.getSelectedNodes()[0]?.data?.username;
  //   if (username != null) {
  //     this.selectUser(username);
  //   }
  // }
}
