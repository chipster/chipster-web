import {Component, ChangeDetectorRef, ViewChild, Output, EventEmitter} from '@angular/core';
import {UploadService} from "../../../shared/services/upload.service";
import Session from "../../../model/session/session";
import {SessionResource} from "../../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../../shared/resources/sessionworker.resource";
import {ErrorService} from "../../error/error.service";

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
    private uploadService: UploadService,
    private sessionResource: SessionResource,
    private sessionWorkerResource: SessionWorkerResource,
    private changeDetectorRef: ChangeDetectorRef,
    private errorService: ErrorService) {
  }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
  }

  fileAdded(file: any) {
    this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);

    this.status = 'Creating session';
    let session = new Session(file.name.replace('.zip', ''));

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
    }).finally(() => {
      this.status = undefined;
    }).subscribe(() => {
      this.openSession.emit(sessionId);
    }, err => {
      this.errorService.headerError("failed to open the session file: " + err, true);
      this.sessionResource.deleteSession(sessionId).subscribe();
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
