import { Injectable } from "@angular/core";
import { CanDeactivate } from "@angular/router";
import { SessionComponent } from "./session.component";
import { Observable } from "rxjs/Observable";
import log from "loglevel";

@Injectable()
export class ModifiedSessionGuard implements CanDeactivate<SessionComponent> {
  canDeactivate(sessionComponent: SessionComponent) {
    return sessionComponent.canDeactivate().catch(err => {
      log.error("route deactivation error", err);
      // allow route change even in case of errors
      return Observable.of(true);
    });
  }
}
