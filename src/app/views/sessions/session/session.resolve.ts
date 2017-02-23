import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {SessionData} from "../../../model/session/session-data";
import SessionResource from "../../../shared/resources/session.resource";
import SelectionService from "./selection.service";

@Injectable()
export class SessionResolve implements Resolve<SessionData> {

  constructor(private sessionResource: SessionResource,
              private selectionService: SelectionService) {}

  resolve(route: ActivatedRouteSnapshot) {
    this.selectionService.clearSelection();
    return this.sessionResource.loadSession(route.params['sessionId']);
  }
}
