import { ChangeDetectorRef, Component } from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionState } from "chipster-js-common/lib/model/session";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { UploadService } from "../../../shared/services/upload.service";

@Component({
  selector: "ch-import-session-modal",
  templateUrl: "./import-session-modal.component.html",
})
export class ImportSessionModalComponent {
  public flow: any;
  fileStatus = new Map<any, string>();
  finishedFiles = new Set<any>();
  files = [];

  constructor(
    private uploadService: UploadService,
    private changeDetectorRef: ChangeDetectorRef,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
    public activeModal: NgbActiveModal,
    private restErrorService: RestErrorService,
  ) {}

  fileAdded(file: any) {
    this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
    const session = new Session(file.name.replace(".zip", ""));
    session.state = SessionState.Import;

    this.fileStatus.set(file, "Creating session");

    this.sessionResource.createSession(session).subscribe(
      (sessionId) => {
        // progress bar is enough for the upload status
        this.fileStatus.set(file, undefined);
        this.uploadService.startUpload(sessionId, file, true);
      },
      (err) => {
        this.error(file, err);
      },
    );
  }

  getFiles() {
    return Array.from(this.fileStatus.keys());
  }

  error(file: any, err) {
    this.fileStatus.set(file, err);
    this.finishedFiles.add(file);
    this.errorService.showError("Failed to open the session file", err);
  }

  cancel(file: any) {
    file.cancel();
    this.fileStatus.delete(file);
    this.sessionResource.deleteSession(file.chipsterSessionId).subscribe(
      () => {
        console.log("session deleted");
      },
      (err) => this.restErrorService.showError("session delete failed", err),
    );
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}
