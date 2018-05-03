import {Router, ActivatedRoute} from "@angular/router";
import {Injectable} from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";

@Injectable()
export class RouteService {

  constructor(
    private router: Router,
    private errorService: ErrorService) { }

  redirectToLoginAndBack() {
    this.navigateAbsolute(['/login'], {queryParams: {returnUrl: this.router.routerState.snapshot.url}});
  }

  /**
   * Navigate to a absolute path within the app url
   *
   * The first part of the url defines the client config to be used.
   * Use relative urls when you know the source route. Otherwise you
   * need aboslute urls. This method allows you to use absolute urls
   * without knowing the first part of the url, i.e. the app name.
   */
  navigateAbsolute(urlSegments: string[], options?) {
    const appRoute = this.getAppRouteCurrent();
    urlSegments.slice().unshift(appRoute);
    return this.router.navigate(urlSegments, options);
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
    return this.getAppRoute(this.router.routerState.snapshot.url);
  }

  getAppRoute(url: string): string {
    // get the app name fron the current route
    const appRoute = url.split('/')[1];
    if (appRoute == null) {
      throw Error('cannot find the app name from the url ' + url);
    }
    return appRoute;
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
