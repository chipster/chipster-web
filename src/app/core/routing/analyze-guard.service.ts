import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import { ActivatedRouteSnapshot } from "@angular/router";
import { RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { SessionResource } from "../../shared/resources/session.resource";
import { Session } from "chipster-js-common";
import { SessionDataService } from "../../views/sessions/session/sessiondata.service";
import log from "loglevel";

/**
 * Redirect to latest session or new session if no latest found.
 */
@Injectable()
export class AnalyzeGuard implements CanActivate {
  constructor(
    private routeService: RouteService,
    private store: Store<any>,
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    let sessions;
    return this.sessionResource
      .getSessions()
      .do(s => (sessions = s))
      .mergeMap(() => this.getLatestSessionFromStore())
      .switchMap((idFromStore: string) => {
        if (
          idFromStore !== null &&
          sessions.some(session => session.sessionId === idFromStore)
        ) {
          log.info("found valid latest session id from store", idFromStore);
          this.routeService.navigateToSession(idFromStore);
          return Observable.of(false); // doesn't really matter?
        } else {
          log.info("no valid latest session id in store");
          const idFromSessionsList = this.getLatestFromSessionsList(sessions);
          if (idFromSessionsList !== null) {
            log.info("latest session id from session db", idFromSessionsList);
            this.routeService.navigateToSession(idFromSessionsList);
            return Observable.of(false);
          } else {
            log.info(
              "no latest session id in session db, creating new session"
            );
            return this.createNewSession().switchMap((newSessionId: string) => {
              if (newSessionId !== null) {
                log.info("created new session", newSessionId);
                this.routeService.navigateToSession(newSessionId);
                return Observable.of(false);
              } else {
                log.warn("creating new session failed, going to sessions list");
                this.routeService.navigateToSessions();
                return Observable.of(false);
              }
            });
          }
        }
      });
  }

  private getLatestSessionFromStore(): Observable<string> {
    return this.store.select("latestSession").take(1);
  }

  private getLatestFromSessionsList(sessions: Session[]): string {
    let latestSession: Session = null;
    sessions.forEach(s => {
      this.sessionDataService.getPersonalRules(s.rules).forEach(rule => {
        if (rule.sharedBy === null) {
          if (!latestSession) {
            latestSession = s;
          } else if (new Date(latestSession.accessed) < new Date(s.accessed)) {
            latestSession = s;
          }
        }
      });
    });
    return latestSession ? latestSession.sessionId : null;
  }

  private createNewSession(): Observable<string> {
    return this.sessionResource.createSession(new Session("New session"));
  }
}
