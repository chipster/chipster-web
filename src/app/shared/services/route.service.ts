import {Router, ActivatedRoute} from "@angular/router";
import {Injectable} from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { NavigationEnd } from "@angular/router";
import { Observable } from "rxjs/internal/Observable";

@Injectable()
export class RouteService {

  appRoute$: Observable<string>;

  constructor(
    private router: Router,
    private errorService: ErrorService) { }

  redirectToLoginAndBack() {
    const appUrl = this.removeAppRoute(this.getCurrentUrl());
    this.navigateAbsolute('/login', {queryParams: {returnUrl: appUrl}});
  }

  redirectToLoginAndBackWithCustomCurrentUrl(currentUrl: string) {

    const appUrl = this.removeAppRoute(currentUrl);
    this.navigateAbsoluteWithCustomCurrentUrl('/login', currentUrl, {queryParams: {returnUrl: appUrl}});
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
    this.navigateAbsoluteWithCustomCurrentUrl(url, this.getCurrentUrl(), options);
  }

  navigateAbsoluteWithCustomCurrentUrl(targetUrl: string, currentUrl: string, options?) {
    const appRoute = this.getAppRouteOfUrl(currentUrl);
    const url = this.buildRouterLink(appRoute, targetUrl);

    // split to array because navigateByUrl() doesn't apply query parameters
    this.router.navigate(url.split('/'), options);
  }

   /**
   * Convert app url to host url using the current path
   */
  getRouterLink(url: string): string {
    console.log('getRouterLink()', url, this.buildRouterLink(this.getAppRouteCurrent(), url));
    return this.buildRouterLink(this.getAppRouteCurrent(), url);
  }

  /**
   * Convert app url to host url asynchronously using the first non-empty app route
   */
  getRouterLink$(appUrl: string): Observable<string> {
    return this.getAppRoute$()
      .map(appRoute => this.buildRouterLink(appRoute, appUrl))
      // complete after the first result to allow use in forkJoin
      .take(1);
  }

  buildRouterLink(appRoute: string, url: string): string {
    return '/' + appRoute + url;
  }

  /**
   * Navigate to relative path
   *
   * @param urlSegments
   */
  navigateRelative(urlSegments: string[], activatedRoute: ActivatedRoute) {
    if (!activatedRoute) {
      throw Error('cannot do relative navigation without the activatedRoute');
    }
    return this.router.navigate(urlSegments, { relativeTo: activatedRoute });
  }

  getCurrentUrl() {
    return this.router.routerState.snapshot.url;
  }

  getAppRouteCurrent() {
    return this.getAppRouteOfUrl(this.getCurrentUrl());
  }

  getAppRouteOfUrl(url: string): string {
    // get the app name fron the current route
    const appRoute = url.split('/')[1];
    if (appRoute == null) {
      throw Error('cannot find the app name from the url ' + url);
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
      this.appRoute$ = this.router.events
        .filter(e => e instanceof NavigationEnd)
        .filter((e: NavigationEnd) => !!e.urlAfterRedirects)
        .filter((e: NavigationEnd) => e.urlAfterRedirects !== "")
        .map((e: NavigationEnd) => this.getAppRouteOfUrl(e.urlAfterRedirects))
        .shareReplay(1); // send the last value even without the route change
    }
    return this.appRoute$;
  }

  /**
   * Get the file name from the url or path
   *
   * @param path string after the last slash
   */
  basename(path) {
    return path.split('/').reverse()[0];
  }

  /**
   * Remove the filename from the url or path
   *
   * @param path string before the last slash
   */
  dirname(path) {
    return path.slice(0, path.lastIndexOf('/'));
  }
}
