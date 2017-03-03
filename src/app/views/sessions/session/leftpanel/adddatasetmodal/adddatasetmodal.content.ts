import Dataset from "../../../../../model/session/dataset";
import {Component, Input, ChangeDetectorRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UploadService} from "../../../../../shared/services/upload.service";

@Component({
  selector: 'ch-add-dataset-modal-content',
  templateUrl: './adddatasetmodal.content.html'
})
export class AddDatasetModalContent {

  @Input() datasetsMap: Map<string, Dataset>;
  @Input() sessionId: string;

  @ViewChild('browseFilesButton') browseFilesButton;
  @ViewChild('browseDirButton') browseDirButton;

  private flow;

  constructor(
    public activeModal: NgbActiveModal,
    private uploadService: UploadService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(
      this.fileAdded.bind(this), this.fileSuccess.bind(this));
  }

  fileAdded(file: any) {
    this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
    this.uploadService.startUpload(this.sessionId, file, this.datasetsMap);
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
