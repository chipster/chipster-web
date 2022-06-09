import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { NotificationsService } from "../../../shared/services/notifications.service";

@Component({
  selector: "ch-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NotificationsComponent implements OnInit {
  constructor(private notificationsService: NotificationsService) {}

  ngOnInit() {
    // return this.configService
    // .getSessionDbUrl()
    // .pipe(
    //   mergeMap((url: string) =>
    //     this.http.get<Session>(`${url}/sessions/${sessionId}`, this.tokenService.getTokenParams(true))
    //   )
    // );
    // .getSessionDbUrl()
    // .pipe(
    //   mergeMap((url: string) => this.authHttpClient.getAuth(url + "/users")),
    //   mergeMap((users: string[]) => {
    //     this.users = users;
    //   }),
    //   this.configService
    //     .getAdminUri(Role.SESSION_DB)
    //     .pipe(
    //       mergeMap((url) => this.authHttpClient.getAuth(url + "/admin/users/" + encodeURIComponent(user) + "/sessions"))
    //     )
    //     .subscribe(
    //       (sessions: any[]) => {
    //         this.userSessionsRowData = sessions;
    //         this.userSessionsState = new LoadState(State.Ready);
    //       },
    //       (err) => this.restErrorService.showError("get quotas failed", err)
    //     );
    // }
  }
}
