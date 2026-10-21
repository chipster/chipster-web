import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-privacy-notice",
  templateUrl: "./privacy-notice.component.html",
  styleUrls: ["./privacy-notice.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ManualComponent],
})
export class PrivacyNoticeComponent implements OnInit {
  private configService = inject(ConfigService);
  private errorService = inject(ErrorService);
  private routeService = inject(RouteService);

  public htmlPath: string;
  public htmlFile: string;
  public routerPath = "privacy-notice";

  ngOnInit() {
    this.configService.get(ConfigService.KEY_PRIVACE_NOTICE_PATH).subscribe({
      next: (path) => {
        if (path || false) {
          this.htmlFile = this.routeService.basename(path);
          this.htmlPath = this.routeService.dirname(path) + "/";
          log.info("loading custom privacy notice page", this.htmlPath, this.htmlFile);
        } else {
          log.error("app config " + ConfigService.KEY_PRIVACE_NOTICE_PATH + " is not set");
        }
      },
      error: (err) => this.errorService.showError("failed to get the path of the privacy notice page", err),
    });
  }
}
