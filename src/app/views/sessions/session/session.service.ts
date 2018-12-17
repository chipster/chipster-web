import { SessionResource } from "../../../shared/resources/session.resource";
import { Session, SessionState } from "chipster-js-common";
import { Injectable } from "@angular/core";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import * as _ from "lodash";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionDataService } from "./session-data.service";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";

@Injectable()
export class SessionService {
  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionDataService: SessionDataService,
    private sessionWorkerResource: SessionWorkerResource
  ) {}

  updateSession(session: Session) {
    return this.sessionResource.updateSession(session);
  }

  openRenameModalAndUpdate(session: Session) {
    this.dialogModalService
      .openSessionNameModal("Rename session", session.name)
      .flatMap((name: string) => {
        session.name = name;

        // 'save' temp session when renaming it
        if (
          session.state === SessionState.TemporaryUnmodified ||
          session.state === SessionState.TemporaryModified
        ) {
          session.state = SessionState.Ready;
        }

        return this.updateSession(session);
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Rename session failed")
      );
  }

  openNotesModalAndUpdate(session: Session) {
    this.dialogModalService
      .openNotesModal(session)
      .flatMap((notes: string) => {
        session.notes = notes;
        return this.updateSession(session);
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Failed to edit session notes")
      );
  }

  downloadSession(sessionId: string) {
    this.sessionDataService.download(
      this.sessionWorkerResource.getPackageUrl(sessionId)
    );
  }
}
