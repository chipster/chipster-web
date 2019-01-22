import { Dataset } from "chipster-js-common";
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
import { SessionResource } from "../../../../../shared/resources/session.resource";
import { ErrorService } from "../../../../../core/errorhandler/error.service";

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

  // function references needed for the flow.off in ngOnDestroy
  // 'this' used inside so need to use => or bind
  update = () => {
    this.files = this.flow.files.slice().reverse();
  };

  complete = () => {
    // this.activeModal.close();
  };

  constructor(
    public activeModal: NgbActiveModal,
    private uploadService: UploadService,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
  ) {}

  ngOnInit() {
    this.flow.on("progress", this.update);
    this.flow.on("fileRemoved", this.update);
    this.flow.on("error", (message, file, chunk) => this.update);
    this.flow.on("complete", this.complete);
  }

  ngOnDestroy() {
    this.flow.off("progress", this.update);
    this.flow.off("fileRemoved", this.update);
    this.flow.off("error", this.update);
    this.flow.off("complete", this.complete);
  }

  // called by upload.component
  fileAdded(file: any) {
    this.uploadService.startUpload(this.sessionId, file);
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.uploadFilesButton);
    this.flow.assignBrowse(this.uploadFolderButton, true);
  }

  cancelUpload(file: any) {
    file.cancel();
    this.sessionResource
      .deleteDataset(file.chipsterSessionId, file.chipsterDatasetId)
      .subscribe(null, err => this.errorService.showError("cancel failed", err));
  }
}
