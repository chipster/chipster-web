import Dataset from "../../../../../model/session/dataset";
import {Component, Input, Inject, ChangeDetectorRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import UploadService from "../../../../../shared/services/upload.service";
import {Observable} from "rxjs";

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
    @Inject('UploadService') private uploadService: UploadService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(
      Observable.of(this.sessionId), this.datasetsMap, this.onChange.bind(this), this.datasetAdded.bind(this));
  }

  onChange() {
    this.changeDetectorRef.detectChanges();
  }

  datasetAdded(datasetId: string) {
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
    this.flow.assignBrowse(this.browseDirButton, true);
  }
}
