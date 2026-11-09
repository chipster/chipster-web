import { Component, OnInit, inject, signal } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-accessibility",
  templateUrl: "./accessibility.component.html",
  styleUrls: ["./accessibility.component.less"],
  imports: [ManualComponent],
})
export class AccessibilityComponent implements OnInit {
  private configService = inject(ConfigService);
  private errorService = inject(ErrorService);
  private routeService = inject(RouteService);

  readonly accessibilityPath = signal<string>(undefined);
  readonly accessibilityFile = signal<string>(undefined);
  public accessibilityRouterPath = "accessibility";

  ngOnInit() {
    this.configService.get(ConfigService.KEY_ACCESSIBILITY_PATH).subscribe({
      next: (path) => {
        if (path || false) {
          this.accessibilityFile.set(this.routeService.basename(path));
          this.accessibilityPath.set(this.routeService.dirname(path) + "/");
          log.info("loading custom accessibility page", this.accessibilityPath(), this.accessibilityFile());
        } else {
          this.accessibilityFile.set("accessibility.html");
          this.accessibilityPath.set("assets/manual/");
        }
      },
      error: (err) => this.errorService.showError("failed to get the path of the accessibility page", err),
    });
  }
}
