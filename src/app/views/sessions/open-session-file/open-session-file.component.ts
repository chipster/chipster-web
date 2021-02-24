import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import log from "loglevel";
import { of, throwError } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { UploadService } from "../../../shared/services/upload.service";
import { DialogModalService } from "../session/dialogmodal/dialogmodal.service";
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

  // store warnings here, because fileSuccess() is called for each file and we want to show all of them at once
  warnings = new Map<string, string[]>();

  constructor(
    private errorService: ErrorService,
    private modalService: NgbModal,
    private uploadService: UploadService,
    private sessionWorkerResource: SessionWorkerResource,
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
  ) {}

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

    this.warnings = new Map();

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
      .pipe(
        mergeMap(response => {
          if (response.errors.length > 0) {
            return throwError(response.errors);
          }          
          
          log.log("extracted, warnings: ", response.warnings, response, file);
          this.warnings.set(file, response.warnings);

          this.fileStatus.set(file, "Deleting temporary copy");
          return this.sessionResource.deleteDataset(sessionId, datasetId);
        }),
        mergeMap(() => {
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

            // if there were warnings
            if (Array.from(this.warnings.values()).some(fileWarnings => fileWarnings.length > 0)) {

              // collect warnings of all sessions to one message
              let msg = "";
              this.warnings.forEach((warnings, file: any) => {
                if (warnings.length > 0) {
                  msg += "Session file " + file.name + " warnings: \n";
                  warnings.forEach(warning => {
                    msg += "- " + warning + "\n";
                  });
                } else {
                  msg += "No warnings in session file " + file.name + ".\n";
                }
              });
              return this.dialogModalService.openPreModal("Session import warnings", msg);
            }
          }
          
          return of(null);
        }),
      )
      .subscribe({
        error: err => {
          this.error(file, err);
          this.sessionResource
          .deleteSession(sessionId)
          .subscribe({
            error: err2 => {
            // original error reported to user already
            log.error(
              "failed to delete the session after another error",
              err2
              );
            }
          });
          }
        });
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
