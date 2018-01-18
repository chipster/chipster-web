import {Injectable} from '@angular/core';
import {CanDeactivate, Router} from '@angular/router';
import {TokenService} from "../../../core/authentication/token.service";
import {SessionComponent} from "./session.component";
import {Observable} from "rxjs/Observable";

@Injectable()
export class ModifiedSessionGuard implements CanDeactivate<SessionComponent> {

  canDeactivate(sessionComponent: SessionComponent) {
    return sessionComponent.canDeactivate()
      .catch(err => {
        console.log('route deactivation error', err);
        // allow route change even in case of errors
        return Observable.of(true);
      });
  }
}
