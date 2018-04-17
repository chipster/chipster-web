import Dataset from "../../../../../model/session/dataset";
import { Component, Input, ViewChild, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadModalComponent } from "./upload-modal.component";
import { UploadService } from "../../../../../shared/services/upload.service";

@Component({
  selector: "ch-add-dataset-modal",
  templateUrl: "./upload.component.html"
})
export class UploadComponent {
  @Input() datasetsMap: Map<string, Dataset>;
  @Input() sessionId: string;

  @ViewChild("browseFilesButton") browseFilesButton;

  flow;

  constructor(
    private modalService: NgbModal,
    private uploadService: UploadService
  ) {}

  // ngOnInit() {
  //   this.flow = this.uploadService
  //     .getFlow
  //     // this.fileAdded.bind(this),
  //     // this.fileSuccess.bind(this)
  //     ();
  // }

  open() {
    const modalRef = this.modalService.open(UploadModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.datasetsMap = this.datasetsMap;
    modalRef.componentInstance.sessionId = this.sessionId;
  }
}
