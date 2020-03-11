import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { from, of, empty } from "rxjs";
import { flatMap, mergeMap, tap, catchError } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import log from "loglevel";

@Component({
  selector: "ch-storage",
  templateUrl: "./storage.component.html",
  styleUrls: ["./storage.component.less"],
  encapsulation: ViewEncapsulation.Emulated
})
export class StorageComponent implements OnInit {
  users: string[];
  quotas: Map<string, any>;

  selectedUser: string;
  sessions: any[];

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

    let sessionDbUrl;
    // check if its working properly
    this.configService
      .getSessionDbUrl()
      .pipe(
        tap(url => (sessionDbUrl = url)),
        mergeMap(() => this.authHttpClient.getAuth(sessionDbUrl + "/users")),
        tap((users: string[]) => (this.users = users)),
        mergeMap((users: string[]) => from(users)),
        mergeMap(user => {
          return this.authHttpClient.getAuth(
            sessionDbUrl + "/users/" + encodeURIComponent(user) + "/quota"
          ).pipe(
            catchError(err => {              
              log.error("quota request error", err);
              // don't cancel other requests even if one of them fails
              return empty();
            }),
          )
        }),        
        tap((quota: any) => this.quotas.set(quota.username, quota)),
      )
      .subscribe(null, err =>
        this.restErrorService.showError("get quotas failed", err)
      );
  }

  selectUser(user: string) {
    this.modalService.open(this.modalContent, { size: "lg" });

    this.selectedUser = user;
    this.sessions = [];

    this.configService
      .getSessionDbUrl()
      .pipe(
        flatMap(url =>
          this.authHttpClient.getAuth(url + "/users/" + user + "/sessions")
        )
      )
      .subscribe(
        (sessions: any[]) => {
          this.sessions = sessions;
        },
        err => this.restErrorService.showError("get quotas failed", err)
      );
  }
}
