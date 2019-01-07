import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { TokenService } from "../../core/authentication/token.service";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { ConfigService } from "../../shared/services/config.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";

@Component({
  selector: "ch-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.less"]
})
export class HomeComponent implements OnInit {
  routerLinkLogin: string;
  routerLinkSessions: string;
  routerLinkAnalyze: string;
  username$: Observable<string>;
  homePath: string;
  homeFile: string;

  homeHeaderPath: string;
  homeHeaderFile: string;
  homeRouterPath: string;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.username$ = this.authenticationService.getUsersDisplayName$();

    this.homeRouterPath = this.routeService.getAppRouteCurrent() + "/";

    this.configService.get(ConfigService.KEY_HOME_PATH).subscribe(
      path => {
        if (path) {
          this.homeFile = this.routeService.basename(path);
          this.homePath = this.routeService.dirname(path) + "/";
          log.info("loading custom home page", this.homePath, this.homeFile);
        }
      },
      err => this.errorService.showError("failed to get the path of the home page", err));

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
      err => this.errorService.showError("failed to get the path of the home page header", err));

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
}
