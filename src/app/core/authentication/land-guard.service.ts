import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { TokenService } from "./token.service";
import { RouteService } from "../../shared/services/route.service";
import { ActivatedRouteSnapshot } from "@angular/router";
import { RouterStateSnapshot } from "@angular/router";

/**
 * Redirect to analyze if user is logged in, otherwise to home.
 */
@Injectable()
export class LandGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private routeService: RouteService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // hack for making router service aware of appName when it's not available in url yet
    const appName = route.url[0].path;
    this.routeService.setBackupAppName(appName);

    if (this.tokenService.isTokenValid()) {
      this.routeService.navigateToAnalyze();
    } else {
      this.routeService.navigateToHome();
    }
    return false; // doesn't really matter since navigating elsewhere before this
  }
}
