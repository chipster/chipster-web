import { Dataset } from "chipster-js-common";
import {
  Component,
  Input,
  ViewChild,
  OnInit,
  AfterViewInit
} from "@angular/core";
import { NgbModal, NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadModalComponent } from "./upload-modal.component";
import { UploadService } from "../../../../../shared/services/upload.service";

@Component({
  selector: "ch-add-dataset-modal",
  templateUrl: "./upload.component.html"
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
    private activeModal: NgbActiveModal
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
      this.modalRef = this.modalService.open(UploadModalComponent, {
        size: "lg"
      });

      this.modalRef.componentInstance.sessionId = this.sessionId;
      this.modalRef.componentInstance.flow = this.flow;
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
}
