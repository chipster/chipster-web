import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Role } from "chipster-js-common";
import * as _ from "lodash";
import { flatMap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";

@Component({
  selector: "ch-clients",
  templateUrl: "./clients.component.html",
  styleUrls: ["./clients.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientsComponent implements OnInit {
  users: any[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    this.configService
      .getInternalService(Role.SESSION_DB, this.tokenService.getToken())
      .pipe(flatMap((service) => this.auhtHttpClient.getAuth(service.adminUri + "/admin/topics")))
      .subscribe(
        (topics: any[]) => {
          this.users = [];

          // filter out server topics and get values as an array
          const sessionIds = Object.keys(topics).filter((topicName) => topicName !== "jobs" && topicName !== "files");
          const sessionTopics = sessionIds.map((id) => topics[id]);

          sessionTopics.forEach((topic) => {
            topic.forEach((user) => {
              const userCopy = _.clone(user);
              // clean up the user ip address
              let ip = userCopy.address;
              // why there is a slash in the beginning?
              if (ip.startsWith("/")) {
                ip = ip.slice(1);
              }
              // the port isn't interesting
              if (ip.indexOf(":") !== -1) {
                ip = ip.slice(0, ip.indexOf(":"));
              }
              userCopy.address = ip;
              this.users.push(userCopy);
            });
          });
        },
        (err) => this.restErrorService.showError("get clients failed", err)
      );
  }
}
