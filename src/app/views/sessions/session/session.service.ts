import { Injectable } from "@angular/core";
import { Dataset, Session, SessionState } from "chipster-js-common";
import * as log from "loglevel";
import { forkJoin, NEVER, Observable } from "rxjs";
import { flatMap, map, mergeMap, tap } from "rxjs/operators";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { ConfigService } from "../../../shared/services/config.service";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";

@Injectable()
export class SessionService {
  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionWorkerResource: SessionWorkerResource,
    private configService: ConfigService,
    private errorService: ErrorService,
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
    log.info("download session", sessionId);
    let datasetId;

    // get read-write token for the session
    var zipDataset$ = this.sessionWorkerResource.packageSession(sessionId).pipe(
      tap((json: any) => {
        let errors = json["errors"];

        if (errors.length > 0) {
          this.restErrorService.showError("failed to create zip package", errors);
          return NEVER;
        }
        // session-worker responds with datasetId
        datasetId = json["datasetId"];
        log.info("zip session datasetId", datasetId);
      }),
      mergeMap(() => this.sessionResource.getDataset(sessionId, datasetId)),
    );

    let downloadUrl$ = this.dialogModalService
      // show spinner the zip file is completed
      .openSpinnerModal("Packaging session", zipDataset$)
      .pipe(mergeMap((dataset) => this.getDownloadUrl(sessionId, dataset)));

    this.download(downloadUrl$);
  }

  isTemporary(session: Session): boolean {
    return session.state === SessionState.TemporaryModified || session.state === SessionState.TemporaryUnmodified;
  }

  /**
   * Get an pre-authenticated url of the dataset file
   *
   * When the url is used for something that can't set the Authorization header
   * (e.g. browser WebSocket client, file downloads and external visualization libraries)
   * we must include the authentiation information in the URL where it's more visible to
   * the user and in server logs.
   *
   * If we would use the user's own token in the URL, the user might share
   * this dataset URL without realising that the token gives access to all
   * session of the user.
   *
   * Use limited token instead, which is valid only for this one dataset on only for a limited
   * time.
   */
  getDatasetUrl(sessionId: string, dataset: Dataset): Observable<string> {
    return forkJoin(
      this.sessionResource.getTokenForDataset(sessionId, dataset.datasetId),
      this.configService.getFileBrokerUrl(),
    ).pipe(
      map((results) => {
        const [datasetToken, url] = results;
        return `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}?token=${datasetToken}`;
      }),
    );
  }

  getDownloadUrl(sessionId: string, dataset: Dataset): Observable<string> {
    return this.getDatasetUrl(sessionId, dataset).pipe(map((url) => url + "&download"));
  }

  exportDatasets(sessionId: string, datasets: Dataset[]) {
    datasets.forEach((d) => this.download(this.getDownloadUrl(sessionId, d)));
  }

  download(url$: Observable<string>) {
    url$.subscribe(
      (url) => {
        window.location.href = url;
      },
      (err) => {
        this.errorService.showError("starting download failed", err);
      },
    );
  }
}
