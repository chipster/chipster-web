import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import { TokenService } from "../authentication/token.service";

/**
 * Redirect to analyze if user is logged in, otherwise to home.
 */
@Injectable()
export class LandGuard implements CanActivate {
  constructor(private tokenService: TokenService, private routeService: RouteService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.tokenService.isTokenValid()) {
      this.routeService.navigateToAnalyze();
    } else {
      this.routeService.navigateToHome();
    }
    return false; // doesn't really matter since navigating elsewhere before this
  }
}
