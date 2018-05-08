import Dataset from "../../../../../model/session/dataset";
import {
  Component,
  Input,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy
} from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadService } from "../../../../../shared/services/upload.service";

@Component({
  selector: "ch-add-dataset-modal-content",
  templateUrl: "./upload-modal.component.html",
  styleUrls: ["./upload-modal.component.less"]
})
export class UploadModalComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() sessionId: string;
  @Input() flow: any;

  @ViewChild("uploadFilesButton") uploadFilesButton;
  @ViewChild("uploadFolderButton") uploadFolderButton;

  files = [];

  // function reference like this needed for the flow.off in ngOnDestroy
  update = function() {
    this.files = this.flow.files.slice().reverse();
    // this.changeDetectorRef.detectChanges();
  }.bind(this);

  constructor(
    public activeModal: NgbActiveModal,
    private uploadService: UploadService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.flow.on("progress", this.update);
    this.flow.on("fileRemoved", this.update);
    this.flow.on("error", (message, file, chunk) => this.update);
  }

  ngOnDestroy() {
    this.flow.off("progress", this.update);
    this.flow.off("fileRemoved", this.update);
    this.flow.off("error", this.update);
  }

  // called by upload.component
  fileAdded(file: any) {
    this.uploadService.startUpload(this.sessionId, file);
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.uploadFilesButton);
    this.flow.assignBrowse(this.uploadFolderButton, true);
  }
}
