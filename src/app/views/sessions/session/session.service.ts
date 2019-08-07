import { Injectable } from "@angular/core";
import { Session, SessionState } from "chipster-js-common";
import { forkJoin } from "rxjs";
import { flatMap, map } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { SessionDataService } from "./session-data.service";

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
      .pipe(
        flatMap((name: string) => {
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
      )
      .subscribe(null, err =>
        this.restErrorService.showError("Rename session failed", err)
      );
  }

  openNotesModalAndUpdate(session: Session) {
    this.dialogModalService
      .openNotesModal(session)
      .pipe(
        flatMap((notes: string) => {
          session.notes = notes;
          return this.updateSession(session);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("Failed to edit session notes", err)
      );
  }

  downloadSession(sessionId: string) {
    const authenticatedUrl$ = forkJoin(
      this.sessionWorkerResource.getPackageUrl(sessionId),
      this.sessionDataService.getTokenForSession(sessionId)
    ).pipe(
      map(resp => {
        const url = resp[0];
        const token = resp[1];
        return url + "?token=" + token;
      })
    );
    this.sessionDataService.download(authenticatedUrl$);
  }
}
