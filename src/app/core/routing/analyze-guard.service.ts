import { Injectable } from "@angular/core";
<<<<<<< HEAD
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";
=======
import { CanActivate } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import { ActivatedRouteSnapshot } from "@angular/router";
import { RouterStateSnapshot } from "@angular/router";
import { Observable, of } from "rxjs";
import { SessionResource } from "../../shared/resources/session.resource";
>>>>>>> 6797bde6db4f4965db655a441a90a8706d6a6995
import { Session, SessionState } from "chipster-js-common";
import log from "loglevel";
import { Observable } from "rxjs/Observable";
import { SessionResource } from "../../shared/resources/session.resource";
import { RouteService } from "../../shared/services/route.service";
import { UserService } from "../../shared/services/user.service";
import { map } from "rxjs/operators";

/**
 * Redirect to latest session or new session if no latest found.
 */
@Injectable()
export class AnalyzeGuard implements CanActivate {
  constructor(
    private routeService: RouteService,
    private sessionResource: SessionResource,
    private userService: UserService
  ) { }

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
          return of(false); // doesn't really matter if it's true or false, since navigating before?
        } else {
          log.info("no valid latest session, creating new session");
          return this.createNewTempSession().pipe(map((newSessionId: string) => {
            if (newSessionId !== null) {
              log.info("created new session", newSessionId);
              this.routeService.navigateToSession(newSessionId);
              return false;
            } else {
              log.warn("creating new session failed, going to sessions list");
              this.routeService.navigateToSessions();
              return false;
            }
          }));
        }
      });
  }

  private createNewTempSession(): Observable<string> {
    const s: Session = new Session("New session");
    s.state = SessionState.TemporaryUnmodified;
    return this.sessionResource.createSession(s);
  }
}
