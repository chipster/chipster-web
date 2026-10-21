import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-accessibility",
  templateUrl: "./accessibility.component.html",
  styleUrls: ["./accessibility.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ManualComponent],
})
export class AccessibilityComponent implements OnInit {
  private configService = inject(ConfigService);
  private errorService = inject(ErrorService);
  private routeService = inject(RouteService);

  public accessibilityPath: string;
  public accessibilityFile: string;
  public accessibilityRouterPath = "accessibility";

  ngOnInit() {
    this.configService.get(ConfigService.KEY_ACCESSIBILITY_PATH).subscribe({
      next: (path) => {
        if (path || false) {
          this.accessibilityFile = this.routeService.basename(path);
          this.accessibilityPath = this.routeService.dirname(path) + "/";
          log.info("loading custom accessibility page", this.accessibilityPath, this.accessibilityFile);
        } else {
          this.accessibilityFile = "accessibility.html";
          this.accessibilityPath = "assets/manual/";
        }
      },
      error: (err) => this.errorService.showError("failed to get the path of the accessibility page", err),
    });
  }
}
