import { Injectable } from "@angular/core";
import {
  CanDeactivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from "@angular/router";
import { SessionComponent } from "./session.component";
import { Observable, of } from "rxjs";
import log from "loglevel";
import { catchError } from "rxjs/operators";

@Injectable()
export class ModifiedSessionGuard implements CanDeactivate<SessionComponent> {
  canDeactivate(
    sessionComponent: SessionComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ) {
    return sessionComponent
      .canDeactivate(sessionComponent, currentRoute, currentState, nextState)
      .pipe(
        catchError(err => {
          log.error("route deactivation error", err);
          // allow route change even in case of errors
          return of(true);
        })
      );
  }
}
