import { Component, OnInit, inject, signal } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-access",
  templateUrl: "./access.component.html",
  imports: [ManualComponent],
})
export class AccessComponent implements OnInit {
  private errorService = inject(ErrorService);
  private configService = inject(ConfigService);
  private routeService = inject(RouteService);

  readonly file = signal<string>(undefined);
  readonly manualPath = signal<string>(undefined);

  ngOnInit(): void {
    this.configService.get(ConfigService.KEY_ACCESS_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.file.set(this.routeService.basename(path));
          this.manualPath.set(this.routeService.dirname(path) + "/");
        }
      },
      error: (err) => {
        this.errorService.showError("Failed to get the access page path", err);
      },
    });
  }
}
