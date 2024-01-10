import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import log from "loglevel";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { SessionComponent } from "./session.component";

@Injectable()
export class ModifiedSessionGuard  {
  canDeactivate(
    sessionComponent: SessionComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ) {
    return sessionComponent.canDeactivate(sessionComponent, currentRoute, currentState, nextState).pipe(
      catchError((err) => {
        log.error("route deactivation error", err);
        // allow route change even in case of errors
        return of(true);
      })
    );
  }
}
