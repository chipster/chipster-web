import { Component, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { SettingsComponent } from "../../shared/components/settings/settings.component";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.less"]
})
export class NavigationComponent implements OnInit {
  routerLinkAdmin = RouteService.PATH_ADMIN;
  routerLinkLogin = RouteService.PATH_LOGIN;
  routerLinkManual = RouteService.PATH_MANUAL;
  routerLinkContact = RouteService.PATH_CONTACT;
  routerLinkHome = RouteService.PATH_HOME;
  routerLinkSessions = RouteService.PATH_SESSIONS;
  routerLinkAnalyze = RouteService.PATH_ANALYZE;
  appName = "";
  appNameReady = false;

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
        if (path) {
          log.info("load custom css from", path);
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
        this.errorService.showError(
          "failed to get the custom favicon path",
          err
        );
      }
    );

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
