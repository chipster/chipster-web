import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { ActivatedRouteSnapshot } from "@angular/router";
import { RouterStateSnapshot } from "@angular/router";
import log from "loglevel";
import { RouteService } from "../../shared/services/route.service";

/**
 *
 */
@Injectable()
export class AppNameGuard implements CanActivate {
  constructor(private router: Router, private routeService: RouteService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const appName = route.url[0].path;
    if (appName === "chipster" || appName === "mylly") {
      this.routeService.setBackupAppName(appName);
      return true;
    } else {
      log.warn("invalid appName", appName, "redirecting to chipster home");
      this.router.navigateByUrl("/chipster/home");
      return false;
    }
  }
}
