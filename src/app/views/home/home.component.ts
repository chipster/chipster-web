import { Component, OnInit, inject, signal } from "@angular/core";
import log from "loglevel";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: "ch-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.less"],
  imports: [ManualComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  private tokenService = inject(TokenService);
  private configService = inject(ConfigService);
  private errorService = inject(ErrorService);
  private routeService = inject(RouteService);

  routerLinkLogin: string;
  routerLinkSessions: string;
  routerLinkAnalyze: string;
  readonly homePath = signal<string>(undefined);
  readonly homeFile = signal<string>(undefined);

  readonly homeHeaderPath = signal<string>(undefined);
  readonly homeHeaderFile = signal<string>(undefined);
  homeRouterPath: string;

  ngOnInit() {
    this.homeRouterPath = RouteService.PATH_HOME;

    this.configService.get(ConfigService.KEY_HOME_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.homeFile.set(this.routeService.basename(path));
          this.homePath.set(this.routeService.dirname(path) + "/");
          log.info("loading custom home page", this.homePath(), this.homeFile());
        }
      },
      error: (err) => this.errorService.showError("failed to get the path of the home page", err),
    });

    this.configService.get(ConfigService.KEY_HOME_HEADER_PATH).subscribe({
      next: (path) => {
        if (path) {
          this.homeHeaderFile.set(this.routeService.basename(path));
          this.homeHeaderPath.set(this.routeService.dirname(path) + "/");
          log.info("loading custom home page header", this.homePath(), this.homeFile());
        }
      },
      error: (err) => this.errorService.showError("failed to get the path of the home page header", err),
    });

    this.routerLinkSessions = this.routeService.getRouterLinkSessions();
    this.routerLinkLogin = this.routeService.getRouterLinkLogin();
    this.routerLinkAnalyze = this.routeService.getRouterLinkAnalyze();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  tokenHasExpired() {
    return this.tokenService.tokenHasExpired();
  }

  getAccountName() {
    return this.tokenService.getAccountName();
  }
}
