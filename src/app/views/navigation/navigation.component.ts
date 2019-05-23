
import {tap, mergeMap} from 'rxjs/operators';
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { TokenService } from "../../core/authentication/token.service";
import { Component, OnInit } from "@angular/core";
import { ConfigService } from "../../shared/services/config.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SettingsComponent } from "../../shared/components/settings/settings.component";

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
  routerLinkAnalyze: string;
  appName = "";
  appNameReady = false;
  appRoute: string;

  constructor(
    public tokenService: TokenService, // used in template
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private errorService: ErrorService,
    private routeService: RouteService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
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
        this.errorService.showError("failed to get the custom css path", err);
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
        this.errorService.showError("failed to get the custom favicon path", err);
      }
    );

    // Navigation component has to use the async version. When the page is loaded without any path, this
    // component is shown before the router redirects because this is outside of the router outlet.
    this.routeService
      .getAppRoute$().pipe(
      mergeMap(() =>
        this.routeService.getRouterLink$(RouteService.PATH_SESSIONS)
      ),
      tap(url => (this.routerLinkSessions = url)),
      mergeMap(() => this.routeService.getRouterLink$(RouteService.PATH_HOME)),
      tap(url => (this.routerLinkHome = url)),
      mergeMap(() =>
        this.routeService.getRouterLink$(RouteService.PATH_CONTACT)
      ),
      tap(url => (this.routerLinkContact = url)),
      mergeMap(() => this.routeService.getRouterLink$(RouteService.PATH_MANUAL)),
      tap(url => (this.routerLinkManual = url)),
      mergeMap(() => this.routeService.getRouterLink$(RouteService.PATH_LOGIN)),
      tap(url => (this.routerLinkLogin = url)),
      mergeMap(() =>
        this.routeService.getRouterLink$(RouteService.PATH_ANALYZE)
      ),
      tap(url => (this.routerLinkAnalyze = url)),
      mergeMap(() => this.routeService.getRouterLink$(RouteService.PATH_ADMIN)),
      tap(url => (this.routerLinkAdmin = url)),)
      .subscribe(null, err => {
        log.info("failed to get the app route", err);
        this.errorService.showError("failed to get the app route", err);
      });

    this.configService.get(ConfigService.KEY_APP_NAME).subscribe(
      name => {
        if (name) {
          this.appName = name;
          document.title = name;
          this.appNameReady = true;
        }
      },
      err => {
        // why error service doesn't show these reliably?
        log.error("failed to get the app name", err);
        this.errorService.showError("failed to get the app name", err);
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

  openSettings() {
    this.modalService.open(SettingsComponent);
  }
}
