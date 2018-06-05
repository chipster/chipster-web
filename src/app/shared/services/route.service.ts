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
    const appUrl = this.removeAppRoute(this.router.routerState.snapshot.url);
    this.navigateAbsolute(['login'], {queryParams: {returnUrl: appUrl}});
  }

  /**
   * Navigate to a absolute path within the app url
   *
   * The first part of the url defines the client config to be used.
   * Use relative urls when you know the source route. Otherwise you
   * need aboslute urls. This method allows you to use absolute urls
   * without knowing the first part of the url, i.e. the app route.
   */
  navigateAbsolute(urlSegments: string[], options?) {
    const urlSegmentsCopy = this.buildRouterLinkArray(this.getAppRouteCurrent(), urlSegments);
    return this.router.navigate(urlSegmentsCopy, options);
  }

  /**
   * Like navigateAbsolute(), but takes the url as string instead of string array
   */
  navigateAbsoluteUrl(url: string) {
    if (url.startsWith('/')) {
      // absolute urls start with slash, but it would create an empty cell to the splitted array
      url = url.slice(1);
    }
    this.navigateAbsolute(url.split('/'));
  }

  /**
   * Conver app urls to host urls e.g. for the routerLinks
   *
   * The first part of the url defines the client config to be used, i.e. app route.
   * The name "host url" refers to the full url which includes the app route and the name
   * "app url" refers to the shorter url without the app route.
   *
   * App urls are useful in the code becasue there is usually no need to care about the
   * app route. Use the navigateAbsolute() method when navigating explicitly.
   * Use this method instead when you need the actual host url, e.g. when creating routerLinks.
   */
  absoluteAppUrlArrayToHostUrlCurrent(urlSegments: string[]): string[] {
    const appRoute = this.getAppRouteCurrent();
    const urlSegmentsCopy = urlSegments.slice();
    urlSegmentsCopy.unshift(appRoute);
    return urlSegmentsCopy;
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
    return this.getAppRoute$()
      .map(appRoute => this.buildRouterLink(appRoute, appUrl))
      // complete after the first result to allow use in forkJoin
      .take(1);
  }

  private buildRouterLink(appRoute: string, url: string): string {
    return '/' + this.buildRouterLinkArray(appRoute, url.split('/')).join('/');
  }

  private buildRouterLinkArray(appRoute: string, urlSegments: string[]): string[] {
    const urlSegmentsCopy = urlSegments.slice();
    urlSegmentsCopy.unshift(appRoute);
    return urlSegmentsCopy;
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

  getAppRouteCurrent() {
    return this.getAppRouteOfUrl(this.router.routerState.snapshot.url);
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
