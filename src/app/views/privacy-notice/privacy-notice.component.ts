import { Component, OnInit } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-privacy-notice",
  templateUrl: "./privacy-notice.component.html",
  styleUrls: ["./privacy-notice.component.less"]
})
export class PrivacyNoticeComponent implements OnInit {
  public htmlPath: string;
  public htmlFile: string;
  public routerPath = "privacy-notice";

  constructor(
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_PRIVACE_NOTICE_PATH).subscribe(
      path => {
        if (path || false) {
          this.htmlFile = this.routeService.basename(path);
          this.htmlPath = this.routeService.dirname(path) + "/";
          log.info(
            "loading custom privacy notice page",
            this.htmlPath,
            this.htmlFile
          );
        } else {
          log.error("app config " + ConfigService.KEY_PRIVACE_NOTICE_PATH + " is not set");
        }
      },
      err =>
        this.errorService.showError(
          "failed to get the path of the privacy notice page",
          err
        )
    );
  }
}
