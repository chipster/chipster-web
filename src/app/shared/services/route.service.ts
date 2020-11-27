import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable()
export class RouteService {
  static readonly PATH_HOME = "/home";
  static readonly PATH_SESSIONS = "/sessions";
  static readonly PATH_ANALYZE = "/analyze";
  static readonly PATH_MANUAL = "/manual";
  static readonly PATH_ACCESS = "/access";
  static readonly PATH_CONTACT = "/contact";
  static readonly PATH_LOGIN = "/login";
  static readonly PATH_ADMIN = "/admin";

  constructor(private router: Router) {}

  redirectToLoginAndBack() {
    const appUrl = this.getCurrentUrl();
    this.navigateAbsolute("/login", { queryParams: { returnUrl: appUrl } });
  }

  redirectToLoginAndBackWithCustomCurrentUrl(currentUrl: string) {
    this.navigateAbsolute("/login", {
      queryParams: { returnUrl: currentUrl }
    });
  }

  navigateAbsolute(url: string, options?) {
    return this.router.navigate(url.split("/"), options);
  }

  navigateToSession(sessionId: string) {
    this.navigateAbsolute(RouteService.PATH_ANALYZE + "/" + sessionId);
  }

  navigateToSessions() {
    this.navigateAbsolute(RouteService.PATH_SESSIONS);
  }

  navigateToAnalyze() {
    this.navigateAbsolute(RouteService.PATH_ANALYZE);
  }

  navigateToHome() {
    this.navigateAbsolute(RouteService.PATH_HOME);
  }

  getRouterLinkSessions() {
    return RouteService.PATH_SESSIONS;
  }

  getRouterLinkAnalyze() {
    return RouteService.PATH_ANALYZE;
  }

  getRouterLinkLogin() {
    return RouteService.PATH_LOGIN;
  }

  getCurrentUrl() {
    return this.router.routerState.snapshot.url;
  }

  /**
   * Get the file name from the url or path
   *
   * @param path string after the last slash
   */
  basename(path) {
    return path.split("/").reverse()[0];
  }

  /**
   * Remove the filename from the url or path
   *
   * @param path string before the last slash
   */
  dirname(path) {
    return path.slice(0, path.lastIndexOf("/"));
  }
}
