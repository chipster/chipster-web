import { AfterViewInit, Component, OnInit, ViewChild, ChangeDetectionStrategy, inject, input } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { UploadService } from "../../../../../shared/services/upload.service";
import { UploadModalComponent } from "./upload-modal.component";
import { DatasetModalService } from "../../selectiondetails/datasetmodal.service";
import { SessionData } from "../../../../../model/session/session-data";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";

@Component({
  selector: "ch-add-dataset-modal",
  templateUrl: "./upload.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NGB_DROPDOWN_IMPORTS],
})
export class UploadComponent implements AfterViewInit, OnInit {
  private modalService = inject(NgbModal);
  private uploadService = inject(UploadService);
  private datasetModalService = inject(DatasetModalService);

  readonly sessionData = input<SessionData>(undefined);

  @ViewChild("uploadFilesButton") uploadFilesButton;
  @ViewChild("uploadFolderButton") uploadFolderButton;

  private flow: any;
  private modalOpen = false;
  private modalRef: NgbModalRef;
  private modal: UploadModalComponent;

  ngOnInit() {
    this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
  }

  fileAdded(file: any) {
    // open modal if not already open
    if (!this.modalOpen) {
      this.modalRef = this.modalService.open(UploadModalComponent, {
        size: "lg",
      });

      this.modal = this.modalRef.componentInstance as UploadModalComponent;
      this.modal.sessionId.set(this.sessionData().session.sessionId);
      this.modal.flow.set(this.flow);
      this.modalOpen = true;

      this.modalRef.result.then(
        () => {
          this.modalOpen = false;
        },
        () => {
          this.modalOpen = false;
        },
      );
    }

    // notify modal that file file was added
    this.modal.fileAdded(file);
  }

  fileSuccess(_file: any) {
    // console.log("file success");
    // remove from the list
    // file.cancel();
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.uploadFilesButton);
    this.flow.assignBrowse(this.uploadFolderButton, true);
  }

  downloadFromUrl() {
    this.uploadService.openDialogAndDowloadFromUrl();
  }

  mergeSession() {
    this.datasetModalService.openMergeSessionToCurrentSessionModal(this.sessionData());
  }
}
