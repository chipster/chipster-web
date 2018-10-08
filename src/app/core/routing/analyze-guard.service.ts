import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import { ActivatedRouteSnapshot } from "@angular/router";
import { RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { SessionResource } from "../../shared/resources/session.resource";
import { Session } from "chipster-js-common";
import log from "loglevel";
import { UserService } from "../../shared/services/user.service";

/**
 * Redirect to latest session or new session if no latest found.
 */
@Injectable()
export class AnalyzeGuard implements CanActivate {
  constructor(
    private routeService: RouteService,
    private sessionResource: SessionResource,
    private userService: UserService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.userService
      .getLatestSession()
      .mergeMap((latestSessionId: string) => {
        if (latestSessionId !== null) {
          log.info("navigating to valid latest session", latestSessionId);
          this.routeService.navigateToSession(latestSessionId);
          return Observable.of(false); // doesn't really matter if it's true or false, since navigating before?
        } else {
          log.info("no valid latest session, creating new session");
          return this.createNewSession().map((newSessionId: string) => {
            if (newSessionId !== null) {
              log.info("created new session", newSessionId);
              this.routeService.navigateToSession(newSessionId);
              return false;
            } else {
              log.warn("creating new session failed, going to sessions list");
              this.routeService.navigateToSessions();
              return false;
            }
          });
        }
      });
  }

  private createNewSession(): Observable<string> {
    return this.sessionResource.createSession(new Session("New session"));
  }
}
