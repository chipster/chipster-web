import { Component, OnInit } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-accessibility",
  templateUrl: "./accessibility.component.html",
  styleUrls: ["./accessibility.component.less"]
})
export class AccessibilityComponent implements OnInit {
  public accessibilityPath: string;
  public accessibilityFile: string;
  public accessibilityRouterPath = "accessibility";

  constructor(
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_ACCESSIBILITY_PATH).subscribe(
      path => {
        if (path || false) {
          this.accessibilityFile = this.routeService.basename(path);
          this.accessibilityPath = this.routeService.dirname(path) + "/";
          log.info(
            "loading custom accessibility page",
            this.accessibilityPath,
            this.accessibilityFile
          );
        } else {
          this.accessibilityFile = "accessibility.html";
          this.accessibilityPath = "assets/manual/";
        }
      },
      err =>
        this.errorService.showError(
          "failed to get the path of the accessibility page",
          err
        )
    );
  }
}
