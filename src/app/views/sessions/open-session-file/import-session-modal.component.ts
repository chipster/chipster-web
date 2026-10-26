import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionState } from "chipster-js-common/lib/model/session";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { UploadService } from "../../../shared/services/upload.service";
import { NgbProgressbar } from "@ng-bootstrap/ng-bootstrap/progressbar";
import { BytesPipe } from "../../../shared/pipes/bytes.pipe";
import { SecondsPipe } from "../../../shared/pipes/secondspipe.pipe";

@Component({
  selector: "ch-import-session-modal",
  templateUrl: "./import-session-modal.component.html",
  imports: [NgbProgressbar, BytesPipe, SecondsPipe],
})
export class ImportSessionModalComponent implements OnInit, OnDestroy {
  private uploadService = inject(UploadService);
  private sessionResource = inject(SessionResource);
  private errorService = inject(ErrorService);
  activeModal = inject(NgbActiveModal);
  private restErrorService = inject(RestErrorService);

  public flow: any;
  fileStatus = new Map<any, string>();
  finishedFiles = new Set<any>();
  files = [];

  fileAdded(file: any) {
    const session = new Session(file.name.replace(".zip", ""));
    session.state = SessionState.Import;

    this.fileStatus.set(file, "Creating session");
    this.statusChanged();

    this.sessionResource.createSession(session).subscribe({
      next: (sessionId) => {
        // progress bar is enough for the upload status
        this.fileStatus.set(file, undefined);
        this.statusChanged();
        this.uploadService.startUpload(sessionId, file, true);
      },
      error: (err) => {
        this.error(file, err);
      },
    });
  }

  /*
   * A snapshot of the files of flow.js and their status, taken when flow.js tells about a change
   * or the status changes. Flow.js changes the progress of its files on every progress event of
   * the requests, but tells about it at most every 500 ms, and this modal and
   * OpenSessionFileComponent change the status in their callbacks.
   */
  readonly rows = signal<ImportRow[]>([]);
  readonly timeRemaining = signal(0);

  statusChanged = () => {
    this.rows.set(
      Array.from(this.fileStatus.keys()).map((file) => ({
        file,
        name: file.name,
        status: this.fileStatus.get(file),
        finished: this.finishedFiles.has(file),
        complete: file.isComplete(),
        size: file.size,
        currentSpeed: file.currentSpeed,
        progress: file.progress(),
        error: file.error,
        errorMessage: file.errorMessage,
      })),
    );
    this.timeRemaining.set(this.flow.timeRemaining());
  };

  ngOnInit() {
    // the progress of the upload
    this.flow.on("progress", this.statusChanged);
    this.flow.on("fileSuccess", this.statusChanged);
    this.flow.on("fileError", this.statusChanged);
    this.flow.on("fileRemoved", this.statusChanged);
  }

  ngOnDestroy() {
    this.flow.off("progress", this.statusChanged);
    this.flow.off("fileSuccess", this.statusChanged);
    this.flow.off("fileError", this.statusChanged);
    this.flow.off("fileRemoved", this.statusChanged);
  }

  error(file: any, err) {
    this.fileStatus.set(file, err);
    this.finishedFiles.add(file);
    this.statusChanged();
    this.errorService.showError("Failed to open the session file", err);
  }

  cancel(file: any) {
    file.cancel();
    this.fileStatus.delete(file);
    this.statusChanged();
    this.sessionResource.deleteSession(file.chipsterSessionId).subscribe({
      next: () => {
        console.log("session deleted");
      },
      error: (err) => this.restErrorService.showError("session delete failed", err),
    });
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}

interface ImportRow {
  // the file of flow.js, for the cancel button
  file: any;
  name: string;
  status: string;
  finished: boolean;
  complete: boolean;
  size: number;
  currentSpeed: number;
  progress: number;
  error: boolean;
  errorMessage: string;
}
