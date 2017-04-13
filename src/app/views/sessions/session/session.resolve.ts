import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {SessionData} from "../../../model/session/session-data";
import {SessionResource} from "../../../shared/resources/session.resource";
import {SelectionHandlerService} from "./selection-handler.service";

@Injectable()
export class SessionResolve implements Resolve<SessionData> {

  constructor(private sessionResource: SessionResource,
              private selectionHandlerService: SelectionHandlerService) {}

  resolve(route: ActivatedRouteSnapshot) {
    this.selectionHandlerService.clearSelections();
    return this.sessionResource.loadSession(route.params['sessionId']);
  }
}
