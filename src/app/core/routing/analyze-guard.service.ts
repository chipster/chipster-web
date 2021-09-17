import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";
import { Session, SessionState } from "chipster-js-common";
import log from "loglevel";
import { Observable, of } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { SessionResource } from "../../shared/resources/session.resource";
import { RouteService } from "../../shared/services/route.service";
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

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.userService.getLatestSession().pipe(
      mergeMap((latestSessionId: string) => {
        if (latestSessionId !== null) {
          log.info("navigating to valid latest session", latestSessionId);
          this.routeService.navigateToSession(latestSessionId);
          return of(false); // doesn't really matter if it's true or false, since navigating before?
        } 
          log.info("no valid latest session, creating new session");
          return this.createNewTempSession().pipe(
            map((newSessionId: string) => {
              if (newSessionId !== null) {
                log.info("created new session", newSessionId);
                this.routeService.navigateToSession(newSessionId);
                return false;
              } 
                log.warn("creating new session failed, going to sessions list");
                this.routeService.navigateToSessions();
                return false;
              
            })
          );
        
      })
    );
  }

  private createNewTempSession(): Observable<string> {
    const s: Session = new Session("New session");
    s.state = SessionState.TemporaryUnmodified;
    return this.sessionResource.createSession(s);
  }
}
