import { Component, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { AccountComponent } from "../../shared/components/account/account.component";
import { SettingsComponent } from "../../shared/components/settings/settings.component";
import { ConfigService } from "../../shared/services/config.service";
import { NewsService } from "../../shared/services/news.service";
import { PreferencesService } from "../../shared/services/preferences.service";
import { RouteService } from "../../shared/services/route.service";
import { DialogModalService } from "../sessions/session/dialogmodal/dialogmodal.service";

@Component({
  selector: "ch-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.less"],
})
export class NavigationComponent implements OnInit {
  routerLinkAdmin = RouteService.PATH_ADMIN;
  routerLinkLogin = RouteService.PATH_LOGIN;
  routerLinkManual = RouteService.PATH_MANUAL;
  routerLinkAccess = RouteService.PATH_ACCESS;
  routerLinkContact = RouteService.PATH_CONTACT;
  routerLinkHome = RouteService.PATH_HOME;
  routerLinkSessions = RouteService.PATH_SESSIONS;
  routerLinkAnalyze = RouteService.PATH_ANALYZE;
  appName = "";
  appNameReady = false;

  // news: NewsItem[];
  // unreadNews: boolean = false;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private errorService: ErrorService,
    private dialogModalService: DialogModalService,
    private modalService: NgbModal,
    private newsService: NewsService,
    private preferencesService: PreferencesService
  ) {}

  ngOnInit() {
    // apply configurable styles
    this.configService.get(ConfigService.KEY_CUSTOM_CSS).subscribe(
      (path) => {
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
      (err) => {
        // why error service doesn't show these reliably?
        log.error("failed to get the custom css path", err);
        this.errorService.showError("failed to get the custom css path", err);
      }
    );

    this.configService.get(ConfigService.KEY_APP_NAME).subscribe(
      (name) => {
        if (name) {
          this.appName = name;
          document.title = name;
          this.appNameReady = true;
        }
      },
      (err) => {
        // why error service doesn't show these reliably?
        log.error("failed to get the app name", err);
        this.errorService.showError("failed to get the app name", err);
      }
    );

    // // news
    // if (this.isLoggedIn()) {
    //   this.getNews();
    // }

    // this.newsService.getNewsEvents().subscribe({
    //   next: () => {
    //     this.getNews();
    //   },
    // });
  }

  // getNews() {
  //   this.newsService.getAllNews().subscribe({
  //     next: (newsItems: NewsItem[]) => {
  //       this.news = newsItems;
  //       console.log("next check if read");
  //       if (this.news != null && this.news.length > 0) {
  //         this.preferencesService.getNewsReadTime().subscribe({
  //           next: (lastReadTime: Date) => {
  //             console.log("got last read time", lastReadTime);
  //             this.unreadNews =
  //               lastReadTime != null && lastReadTime < this.newsService.getCreateOrModified(this.news[0]);
  //             console.log(this.unreadNews);
  //           },
  //         });
  //       }
  //     },
  //   });
  // }

  logout(): void {
    this.authenticationService.logout();
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.isLoggedIn() && this.tokenService.hasRole("admin");
  }

  openAccount(): void {
    this.modalService.open(AccountComponent);
  }

  openSettings(): void {
    this.modalService.open(SettingsComponent);
  }

  getAccountName(): string {
    return this.tokenService.getAccountName();
  }

  getUserId(): string {
    return this.tokenService.getUsername();
  }

  public openNews() {
    this.dialogModalService.openNewsModal().subscribe({
      complete: () => {
        // this.unreadNews = false;
      },
    });
  }
}
