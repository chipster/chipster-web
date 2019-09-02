import { Component, OnInit } from "@angular/core";
import log from "loglevel";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.less"]
})
export class HomeComponent implements OnInit {
  routerLinkLogin: string;
  routerLinkSessions: string;
  routerLinkAnalyze: string;
  homePath: string;
  homeFile: string;

  homeHeaderPath: string;
  homeHeaderFile: string;
  homeRouterPath: string;

  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.homeRouterPath = RouteService.PATH_HOME;

    this.configService.get(ConfigService.KEY_HOME_PATH).subscribe(
      path => {
        if (path) {
          this.homeFile = this.routeService.basename(path);
          this.homePath = this.routeService.dirname(path) + "/";
          log.info("loading custom home page", this.homePath, this.homeFile);
        }
      },
      err =>
        this.errorService.showError(
          "failed to get the path of the home page",
          err
        )
    );

    this.configService.get(ConfigService.KEY_HOME_HEADER_PATH).subscribe(
      path => {
        if (path) {
          this.homeHeaderFile = this.routeService.basename(path);
          this.homeHeaderPath = this.routeService.dirname(path) + "/";
          log.info(
            "loading custom home page header",
            this.homePath,
            this.homeFile
          );
        }
      },
      err =>
        this.errorService.showError(
          "failed to get the path of the home page header",
          err
        )
    );

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
