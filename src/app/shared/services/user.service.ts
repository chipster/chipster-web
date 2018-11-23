import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { SET_LATEST_SESSION } from "../../state/latest-session.reducer";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { User } from "chipster-js-common";
import log from "loglevel";
import { Observable } from "rxjs/Observable";
import { SessionResource } from "../resources/session.resource";

@Injectable()
export class UserService {
  constructor(
    private store: Store<any>,
    private authenticationService: AuthenticationService,
    private sessionResource: SessionResource
  ) {}

  public updateLatestSession(sessionId: string) {
    this.updateLatestSessionToStore(sessionId);
    this.updateLatestSessionToSessionDb(sessionId);
  }

  updateLatestSessionToStore(sessionId: string) {
    this.store.dispatch({
      type: SET_LATEST_SESSION,
      payload: sessionId
    });
  }

  updateLatestSessionToSessionDb(sessionId: string) {
    // FIXME only update if changed?
    this.authenticationService
      .getUser()
      .mergeMap((user: User) => {
        user.latestSession = sessionId;
        return this.authenticationService.updateUser(user);
      })
      .subscribe(
        () => {
          log.info("update latest session to sessionDb successful");
        },
        err => {
          log.warn("updating latest session to sessionDb failed");
        }
      );
  }

  getLatestSession(): Observable<string> {
    let sessions;
    return this.sessionResource
      .getSessions() // sessions are needed to check if possibly found latest session still exists
      .do(s => (sessions = s))
      .mergeMap(() => {
        return this.getLatestSessionFromStore().mergeMap(
          (idFromStore: string) => {
            if (
              idFromStore !== null &&
              sessions.some(session => session.sessionId === idFromStore)
            ) {
              log.info("found valid latest session id from store", idFromStore);
              return Observable.of(idFromStore);
            } else {
              log.info("no valid latest session id in store");
              return this.getLatestSessionFromSessionDb();
            }
          }
        );
      });
  }

  getLatestSessionFromStore(): Observable<string> {
    return this.store.select("latestSession").take(1);
  }

  getLatestSessionFromSessionDb(): Observable<string> {
    return this.authenticationService.getUser().map((user: User) => {
      return user.latestSession;
    });
  }
}
