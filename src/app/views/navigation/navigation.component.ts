import { AuthenticationService } from "../../core/authentication/authenticationservice";
import { TokenService } from "../../core/authentication/token.service";

import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { User } from "chipster-js-common";
import { ConfigService } from "../../shared/services/config.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RouteService } from "../../shared/services/route.service";
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import log from "loglevel";

@Component({
  selector: "ch-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.less"]
})
export class NavigationComponent implements OnInit {
  routerLinkAdmin: string;
  routerLinkLogin: string;
  routerLinkManual: string;
  routerLinkContact: string;
  routerLinkHome: string;
  routerLinkSessions: string;
  username$: Observable<string>;
  appName = "";
  appRoute: string;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.username$ = this.authenticationService.getUsersDisplayName$();
    this.tokenService.getToken();

    // apply configurable styles
    this.configService.get(ConfigService.KEY_CUSTOM_CSS).subscribe(
      path => {
        log.info("load custom css from", path);
        if (path) {
          const link = document.createElement("link");
          link.href = path;
          link.type = "text/css";
          link.rel = "stylesheet";
          link.media = "screen,print";

          document.getElementsByTagName("head")[0].appendChild(link);
        }
      },
      err => {
        // why error service doesn't show these reliably?
        log.error("failed to get the custom css path", err);
        this.errorService.headerError(
          "failed to get the custom css path: " + err,
          true
        );
      }
    );

    this.configService.get(ConfigService.KEY_FAVICON).subscribe(
      path => {
        log.info("load custom favicon from", path);
        if (path) {
          const link: HTMLLinkElement =
            document.querySelector("link[rel*='icon']") ||
            document.createElement("link");
          link.type = "image/x-icon";
          link.rel = "shortcut icon";
          link.href = path;
          document.getElementsByTagName("head")[0].appendChild(link);
        }
      },
      err => {
        // why error service doesn't show these reliably?
        log.error("failed to get the favicon path", err);
        this.errorService.headerError(
          "failed to get the custom favicon path: " + err,
          true
        );
      }
    );

    // Navigation component has to use the async version. When the page is loaded without any path, this
    // component is shown before the router redirects because this is outside of the router outlet.
    this.routeService
      .getAppRoute$()
      .flatMap(() => this.routeService.getRouterLink$("/sessions"))
      .do(url => (this.routerLinkSessions = url))
      .flatMap(() => this.routeService.getRouterLink$("/home"))
      .do(url => (this.routerLinkHome = url))
      .flatMap(() => this.routeService.getRouterLink$("/contact"))
      .do(url => (this.routerLinkContact = url))
      .flatMap(() => this.routeService.getRouterLink$("/manual"))
      .do(url => (this.routerLinkManual = url))
      .flatMap(() => this.routeService.getRouterLink$("/login"))
      .do(url => (this.routerLinkLogin = url))
      .flatMap(() => this.routeService.getRouterLink$("/admin"))
      .do(url => (this.routerLinkAdmin = url))
      .subscribe(null, err => {
        log.info("failed to get the app route", err);
        this.errorService.headerError(
          "failed to get the app route: " + err,
          true
        );
      });

    this.configService.get(ConfigService.KEY_APP_NAME).subscribe(
      name => {
        if (name) {
          this.appName = name;
          document.title = name;
        }
      },
      err => {
        // why error service doesn't show these reliably?
        log.error("failed to get the app name", err);
        this.errorService.headerError(
          "failed to get the app name: " + err,
          true
        );
      }
    );
  }

  logout() {
    this.authenticationService.logout();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  isAdmin() {
    return this.isLoggedIn() && this.tokenService.hasRole("admin");
  }
}
