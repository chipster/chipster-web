
import {shareReplay, filter, map, take} from 'rxjs/operators';
import { Router, ActivatedRoute } from "@angular/router";
import { Injectable } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { NavigationEnd } from "@angular/router";
import { Observable } from "rxjs";
import log from "loglevel";

@Injectable()
export class RouteService {
  static readonly PATH_HOME = "/home";
  static readonly PATH_SESSIONS = "/sessions";
  static readonly PATH_ANALYZE = "/analyze";
  static readonly PATH_MANUAL = "/manual";
  static readonly PATH_CONTACT = "/contact";
  static readonly PATH_LOGIN = "/login";
  static readonly PATH_ADMIN = "/admin";

  appRoute$: Observable<string>;
  private backupAppName: string;

  constructor(private router: Router, private errorService: ErrorService) {}

  redirectToLoginAndBack() {
    const appUrl = this.removeAppRoute(this.getCurrentUrl());
    this.navigateAbsolute("/login", { queryParams: { returnUrl: appUrl } });
  }

  redirectToLoginAndBackWithCustomCurrentUrl(currentUrl: string) {
    const appUrl = this.removeAppRoute(currentUrl);
    this.navigateAbsoluteWithCustomCurrentUrl("/login", currentUrl, {
      queryParams: { returnUrl: appUrl }
    });
  }

  /**
   * Navigate to a absolute path within the app url
   *
   * The first part of the url defines the client config to be used.
   * Use relative urls when you know the source route. Otherwise you
   * need aboslute urls. This method allows you to use absolute urls
   * without knowing the first part of the url, i.e. the app route.
   */
  navigateAbsolute(url: string, options?) {
    return this.navigateAbsoluteWithCustomCurrentUrl(
      url,
      this.getCurrentUrl(),
      options
    );
  }

  navigateAbsoluteWithCustomCurrentUrl(
    targetUrl: string,
    currentUrl: string,
    options?
  ) {
    const appRoute = this.getAppRouteOfUrl(currentUrl);
    const url = this.buildRouterLink(appRoute, targetUrl);

    // split to array because navigateByUrl() doesn't apply query parameters
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
    return this.getRouterLink(RouteService.PATH_SESSIONS);
  }

  getRouterLinkAnalyze() {
    return this.getRouterLink(RouteService.PATH_ANALYZE);
  }

  getRouterLinkLogin() {
    return this.getRouterLink(RouteService.PATH_LOGIN);
  }

  /**
   * Convert app url to host url using the current path
   */
  getRouterLink(url: string): string {
    return this.buildRouterLink(this.getAppRouteCurrent(), url);
  }

  /**
   * Convert app url to host url asynchronously using the first non-empty app route
   */
  getRouterLink$(appUrl: string): Observable<string> {
    return (
      this.getAppRoute$().pipe(
        map(appRoute => this.buildRouterLink(appRoute, appUrl)),
        // complete after the first result to allow use in forkJoin
        take(1),)
    );
  }

  buildRouterLink(appRoute: string, url: string): string {
    return "/" + appRoute + url;
  }

  /**
   * Navigate to relative path
   *
   * @param urlSegments
   */
  navigateRelative(urlSegments: string[], activatedRoute: ActivatedRoute) {
    if (!activatedRoute) {
      throw Error("cannot do relative navigation without the activatedRoute");
    }
    return this.router.navigate(urlSegments, { relativeTo: activatedRoute });
  }

  getCurrentUrl() {
    return this.router.routerState.snapshot.url;
  }

  getAppRouteCurrent() {
    let appRoute;
    try {
      appRoute = this.getAppRouteOfUrl(this.getCurrentUrl());
    } catch (e) {
      if (this.backupAppName) {
        appRoute = this.backupAppName;
      } else {
        throw Error(
          "cannot find the app name from the url and no backup name available"
        );
      }
    }
    return appRoute;
  }

  getAppRouteOfUrl(url: string): string {
    // get the app name fron the current route
    let appRoute = url.split("/")[1];
    if (appRoute == null) {
      if (this.backupAppName) {
        appRoute = this.backupAppName;
      } else {
        throw Error(
          "cannot find the app name from the url and no backup name available " +
            url
        );
      }
    }
    return appRoute;
  }

  removeAppRoute(url: string): string {
    const appRoute = this.getAppRouteOfUrl(url);
    return url.slice(appRoute.length + 1);
  }

  /**
   * Get the app route observable
   *
   * Get the app route of the previous route change or wait for the first non-empty
   * route to get it.
   */
  getAppRoute$(): Observable<string> {
    if (!this.appRoute$) {
      this.appRoute$ = this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        filter((e: NavigationEnd) => !!e.urlAfterRedirects),
        filter((e: NavigationEnd) => e.urlAfterRedirects !== ""),
        map((e: NavigationEnd) => this.getAppRouteOfUrl(e.urlAfterRedirects)),
        shareReplay(1),); // send the last value even without the route change
    }
    return this.appRoute$;
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

  setBackupAppName(appName: string) {
    log.info("setting backup application name to", appName);
    this.backupAppName = appName;
  }
}
