import {Component, Inject, ChangeDetectorRef, ViewChild, Output, EventEmitter} from '@angular/core';
import UploadService from "../../../shared/services/upload.service";
import Session from "../../../model/session/session";
import SessionResource from "../../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../../shared/resources/sessionworker.resource";

@Component({
  selector: 'ch-open-session-file',
  templateUrl: './opensessionfile.component.html'
})
export class OpenSessionFile {

  private status;

  @ViewChild('browseFilesButton') browseFilesButton;

  @Output('openSession') openSession = new EventEmitter();

  private flow;

  constructor(
    @Inject('UploadService') private uploadService: UploadService,
    @Inject('SessionResource') private sessionResource: SessionResource,
    @Inject('SessionWorkerResource') private sessionWorkerResource: SessionWorkerResource,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
  }

  fileAdded(file: any) {
    this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);

    this.status = 'Creating session';
    let session = new Session('Opening session file...');

    this.sessionResource.createSession(session).subscribe((sessionId) => {
      // progress bar is enough for the upload status
      this.status = undefined;
      this.uploadService.startUpload(sessionId, file, null);
    });
  }

  fileSuccess(file: any) {
    // remove from the list
    file.cancel();
    let sessionId = file.chipsterSessionId;
    let datasetId = file.chipsterDatasetId;

    this.status = 'Extracting session';
    return this.sessionWorkerResource.extractSession(sessionId, datasetId).flatMap(response => {
      console.log('extracted, warnings: ', response.warnings);
      this.status = 'Deleting temporary copy';
      return this.sessionResource.deleteDataset(sessionId, datasetId);
    }).subscribe(() => {
      this.status = undefined;
      this.openSession.emit(sessionId);
    });
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
  }

  cancel(file: any) {
    file.cancel();
    this.status = undefined;
    this.sessionResource.deleteSession(file.chipsterSessionId).subscribe(() => {
      console.log('session deleted');
    });
  }
}
