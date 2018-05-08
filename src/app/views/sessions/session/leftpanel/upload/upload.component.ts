import Dataset from "../../../../../model/session/dataset";
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
    console.log("file added", file);

    if (!this.modalOpen) {
      console.log("opening upload modal");

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
    } else {
      console.log("upload modal already open");
    }

    console.log("modal ref", this.modalRef);

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
