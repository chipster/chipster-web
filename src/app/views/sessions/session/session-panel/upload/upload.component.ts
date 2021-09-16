import { AfterViewInit, Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { UploadService } from "../../../../../shared/services/upload.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { JobService } from "../../job.service";
import { UploadModalComponent } from "./upload-modal.component";

@Component({
  selector: "ch-add-dataset-modal",
  templateUrl: "./upload.component.html",
})
export class UploadComponent implements AfterViewInit, OnInit {
  @Input() datasetsMap: Map<string, Dataset>;
  @Input() sessionId: string;

  @ViewChild("uploadFilesButton") uploadFilesButton;
  @ViewChild("uploadFolderButton") uploadFolderButton;

  private flow: any;
  private modalOpen = false;
  private modalRef: any;

  constructor(
    private modalService: NgbModal,
    private uploadService: UploadService,
    private dialogModalService: DialogModalService,
    private errorService: ErrorService,
    private jobService: JobService,
    private activeModal: NgbActiveModal
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

      this.modalRef.componentInstance.sessionId = this.sessionId;
      this.modalRef.componentInstance.flow = this.flow;
      this.modalOpen = true;

      this.modalRef.result.then(
        (result) => {
          this.modalOpen = false;
        },
        (reason) => {
          this.modalOpen = false;
        }
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
}
