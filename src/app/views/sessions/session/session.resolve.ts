import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {SessionData} from "../../../model/session/session-data";
import SessionResource from "../../../shared/resources/session.resource";

@Injectable()
export class SessionResolve implements Resolve<SessionData> {

  constructor(private sessionResource: SessionResource) {}

  resolve(route: ActivatedRouteSnapshot) {
    return this.sessionResource.loadSession(route.params['sessionId']).do(x => console.log('SessionResolve observalbe', x));
  }
}
