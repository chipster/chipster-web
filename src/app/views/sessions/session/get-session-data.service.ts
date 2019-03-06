import { Injectable } from "@angular/core";
import { SessionData } from "../../../model/session/session-data";

@Injectable()
export class GetSessionDataService {
  private sessionData: SessionData;

  constructor() {}

  getSessionData(): SessionData {
    return this.sessionData;
  }

  setSessionData(sessionData: SessionData) {
    this.sessionData = sessionData;
  }
}
