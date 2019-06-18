import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { throwError } from "rxjs";
import { flatMap } from 'rxjs/operators';
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { UploadService } from "../../../shared/services/upload.service";
import { ImportSessionModalComponent } from "./import-session-modal.component";

@Component({
  selector: "ch-open-session-file",
  templateUrl: "./open-session-file.component.html",
  styleUrls: ["./open-session-file.component.less"]
})
export class OpenSessionFileComponent implements AfterViewInit, OnInit {
  @ViewChild("browseFilesButton")
  browseFilesButton;

  private flow;
  private modalOpen = false;
  private modalRef: any;
  @Output("done")
  done = new EventEmitter();

  fileStatus = new Map<any, string>();
  finishedFiles = new Set<any>();

  constructor(
    private errorService: ErrorService,
    private modalService: NgbModal,
    private uploadService: UploadService,
    private sessionWorkerResource: SessionWorkerResource,
    private sessionResource: SessionResource,
    private restErrorService: RestErrorService,
  ) { }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(
      this.fileAdded.bind(this),
      this.fileSuccess.bind(this)
    );
  }

  fileAdded(file: any) {
    // open modal if not already open
    if (!this.modalOpen) {
      this.modalRef = this.modalService.open(ImportSessionModalComponent, {
        size: "lg"
      });

      this.modalRef.componentInstance.flow = this.flow;
      this.modalRef.componentInstance.fileStatus = this.fileStatus;
      this.modalRef.componentInstance.finishedFiles = this.finishedFiles;
      this.modalOpen = true;

      this.modalRef.result.then(
        result => {
          this.modalOpen = false;
        },
        reason => {
          this.modalOpen = false;
        }
      );
    }
    // notify the modal that file was added
    this.modalRef.componentInstance.fileAdded(file);
  }

  fileSuccess(file: any) {
    const sessionId = file.chipsterSessionId;
    const datasetId = file.chipsterDatasetId;

    // remove from the list
    file.cancel();

    this.fileStatus.set(file, "Extracting session");
    return this.sessionWorkerResource
      .extractSession(sessionId, datasetId)
      .pipe(flatMap(response => {
        if (response.errors.length > 0) {
          return throwError(response.errors);
        }
        log.log("extracted, warnings: ", response.warnings, response);
        this.fileStatus.set(file, "Deleting temporary copy");
        return this.sessionResource.deleteDataset(sessionId, datasetId);
      }))
      .subscribe(
        () => {
          this.fileStatus.set(file, undefined);
          this.finishedFiles.add(file);

          // let the caller know if this was the last one
          if (this.fileStatus.size === this.finishedFiles.size) {
            const sessionIds = Array.from(this.finishedFiles).map(
              f => file.chipsterSessionId
            );
            this.fileStatus.clear();
            this.finishedFiles.clear();
            this.done.emit(sessionIds);
            if (this.modalOpen) {
              this.modalRef.componentInstance.closeModal();
            }
          }
        },
        err => {
          this.error(file, err);
          this.sessionResource.deleteSession(sessionId).subscribe(null, err2 => {
            // original error reported to user already
            log.error("failed to delete the session after another error", err2);
          });
        }
      );
  }

  error(file: any, err) {
    this.fileStatus.set(file, err);
    this.finishedFiles.add(file);
    this.errorService.showError("Failed to open the session file", err);
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
  }
}
