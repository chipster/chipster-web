import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { EMPTY, from } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../model/loadstate";
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
  quotas: Map<string, any>;

  selectedUser: string;
  sessions: any[];

  userSessionsState: LoadState;

  @ViewChild("modalContent") modalContent: any;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.users = [];
    this.quotas = new Map();

    let sessionDbUrl: string;
    // check if its working properly
    this.configService
      .getSessionDbUrl()
      .pipe(
        tap((url) => {
          sessionDbUrl = url;
        }),
        mergeMap(() => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
        tap((users: string[]) => {
          this.users = users;
        }),
        mergeMap((users: string[]) => from(users)),
        mergeMap((user) =>
          this.authHttpClient.getAuth(sessionDbUrl + "/users/" + encodeURIComponent(user) + "/quota").pipe(
            catchError((err) => {
              log.error("quota request error", err);
              // don't cancel other requests even if one of them fails
              return EMPTY;
            })
          )
        ),
        tap((quota: any) => this.quotas.set(quota.username, quota))
      )
      .subscribe({
        error: (err) => this.restErrorService.showError("get quotas failed", err),
      });
  }

  selectUser(user: string) {
    this.modalService.open(this.modalContent, { size: "xl" });

    this.selectedUser = user;
    this.userSessionsState = new LoadState(State.Loading);
    this.sessions = [];

    this.configService
      .getSessionDbUrl()
      .pipe(mergeMap((url) => this.authHttpClient.getAuth(url + "/users/" + encodeURIComponent(user) + "/sessions")))
      .subscribe(
        (sessions: any[]) => {
          this.sessions = sessions;
          this.userSessionsState = new LoadState(State.Ready);
        },
        (err) => this.restErrorService.showError("get quotas failed", err)
      );
  }
}
