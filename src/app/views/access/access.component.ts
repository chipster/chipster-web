import { Component, OnInit } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-access",
  templateUrl: "./access.component.html",
})
export class AccessComponent implements OnInit {
  file: string;
  manualPath: string;

  constructor(
    private errorService: ErrorService,
    private configService: ConfigService,
    private routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.configService.get(ConfigService.KEY_ACCESS_PATH).subscribe(
      (path) => {
        if (path) {
          this.file = this.routeService.basename(path);
          this.manualPath = this.routeService.dirname(path) + "/";
        }
      },
      (err) => {
        this.errorService.showError("Failed to get the access page path", err);
      }
    );
  }
}
