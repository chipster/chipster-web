import { AfterViewInit, Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadService } from "../../../../../shared/services/upload.service";
import { UploadModalComponent } from "./upload-modal.component";
import { DatasetModalService } from "../../selectiondetails/datasetmodal.service";
import { SessionData } from "../../../../../model/session/session-data";

@Component({
  selector: "ch-add-dataset-modal",
  templateUrl: "./upload.component.html",
})
export class UploadComponent implements AfterViewInit, OnInit {
  @Input() sessionData: SessionData;

  @ViewChild("uploadFilesButton") uploadFilesButton;
  @ViewChild("uploadFolderButton") uploadFolderButton;

  private flow: any;
  private modalOpen = false;
  private modalRef: any;

  constructor(
    private modalService: NgbModal,
    private uploadService: UploadService,
    private datasetModalService: DatasetModalService,
  ) {}

  ngOnInit() {
    this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
  }

  fileAdded(file: any) {
    // open modal if not already open
    if (!this.modalOpen) {
      this.modalRef = this.modalService.open(UploadModalComponent, {
        size: "lg",
      });

      this.modalRef.componentInstance.sessionId = this.sessionData.session.sessionId;
      this.modalRef.componentInstance.flow = this.flow;
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
    this.modalRef.componentInstance.fileAdded(file);
  }

  fileSuccess(file: any) {
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
    console.log("mergeSession()");
    this.datasetModalService.openMergeSessionModal(this.sessionData);
  }
}
