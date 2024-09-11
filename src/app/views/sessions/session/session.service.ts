import { Injectable } from "@angular/core";
import { Dataset, Session, SessionEvent, SessionState } from "chipster-js-common";
import { filter, flatMap, map, mergeMap, take, tap } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { SessionDataService } from "./session-data.service";
import { SessionEventService } from "./session-event.service";

@Injectable()
export class SessionService {
  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionDataService: SessionDataService,
    private sessionWorkerResource: SessionWorkerResource,
    private sessionEventService: SessionEventService,
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
          if (session.state === SessionState.TemporaryUnmodified || session.state === SessionState.TemporaryModified) {
            session.state = SessionState.Ready;
          }

          return this.updateSession(session);
        }),
      )
      .subscribe(null, (err) => this.restErrorService.showError("Rename session failed", err));
  }

  openNotesModalAndUpdate(session: Session) {
    this.dialogModalService
      .openNotesModal(session)
      .pipe(
        flatMap((notes: string) => {
          session.notes = notes;
          return this.updateSession(session);
        }),
      )
      .subscribe(null, (err) => this.restErrorService.showError("Failed to edit session notes", err));
  }

  downloadSession(sessionId: string) {
    var datasetId = null;

    // get read-write token for the session
    var zipDataset$ = this.sessionDataService.getTokenForSession(sessionId, true).pipe(
      // ask session-worker to package the session to a zip file and save it as a dataset to the server session
      mergeMap((token) => this.sessionWorkerResource.packageSession(sessionId, token)),
      // session-worker responds with datasetId
      tap((id: string) => (datasetId = id)),
      // get stream of dataset changes
      mergeMap(() => this.sessionEventService.getDatasetStream()),
      // wait until we see the compoleted zip file dataset (SessionEventService filters out uploading dataset events)
      filter((e: SessionEvent) => e.event.resourceId === datasetId),
      // first event is enough (there are soon more events, e.g. updated position and deletion)
      take(1),
      // exportDatasets() wants the Dataset object
      map((e: SessionEvent) => e.newValue),
    );

    this.dialogModalService
      // show spinner the zip file is completed
      .openSpinnerModal("Preparing download", zipDataset$)
      // start download when it does
      .pipe(tap((dataset: Dataset) => this.sessionDataService.exportDatasets([dataset])))
      .subscribe(null, (err) => this.restErrorService.showError("Failed to start the download", err));
  }

  isTemporary(session: Session): boolean {
    return session.state === SessionState.TemporaryModified || session.state === SessionState.TemporaryUnmodified;
  }
}
