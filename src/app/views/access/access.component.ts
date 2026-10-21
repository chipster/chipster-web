import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-access",
  templateUrl: "./access.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ManualComponent],
})
export class AccessComponent implements OnInit {
  private errorService = inject(ErrorService);
  private configService = inject(ConfigService);
  private routeService = inject(RouteService);

  file: string;
  manualPath: string;

  ngOnInit(): void {
    this.configService.get(ConfigService.KEY_ACCESS_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.file = this.routeService.basename(path);
          this.manualPath = this.routeService.dirname(path) + "/";
        }
      },
      error: (err) => {
        this.errorService.showError("Failed to get the access page path", err);
      },
    });
  }
}
