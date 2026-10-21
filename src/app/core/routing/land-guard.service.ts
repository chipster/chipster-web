import { Injectable, inject } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import { TokenService } from "../authentication/token.service";

/**
 * Redirect to analyze if user is logged in, otherwise to home.
 */
@Injectable({ providedIn: "root" })
export class LandGuard {
  private tokenService = inject(TokenService);
  private routeService = inject(RouteService);

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    if (this.tokenService.isTokenValid()) {
      this.routeService.navigateToAnalyze();
    } else {
      this.routeService.navigateToHome();
    }
    return false; // doesn't really matter since navigating elsewhere before this
  }
}
