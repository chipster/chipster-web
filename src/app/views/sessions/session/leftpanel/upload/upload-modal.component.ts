import Dataset from "../../../../../model/session/dataset";
import {
  Component,
  Input,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  OnInit
} from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadService } from "../../../../../shared/services/upload.service";

@Component({
  selector: "ch-add-dataset-modal-content",
  templateUrl: "./upload-modal.component.html"
})
export class UploadModalComponent implements AfterViewInit, OnInit {
  @Input() sessionId: string;

  @ViewChild("browseFilesButton") browseFilesButton;
  @ViewChild("browseDirButton") browseDirButton;

  flow;

  constructor(
    public activeModal: NgbActiveModal,
    private uploadService: UploadService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.flow = this.uploadService.getFlow(
      this.fileAdded.bind(this),
      this.fileSuccess.bind(this)
    );
  }

  fileAdded(file: any) {
    this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
    this.uploadService.startUpload(this.sessionId, file);
  }

  fileSuccess(file: any) {
    // remove from the list
    file.cancel();
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
    this.flow.assignBrowse(this.browseDirButton, true);
  }
}
