import {Component, ChangeDetectorRef, ViewChild, Output, EventEmitter, AfterViewInit} from '@angular/core';
import {UploadService} from "../../../shared/services/upload.service";
import Session from "../../../model/session/session";
import {SessionResource} from "../../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../../shared/resources/sessionworker.resource";
import {ErrorService} from "../../../core/errorhandler/error.service";

@Component({
  selector: 'ch-open-session-file',
  templateUrl: './opensessionfile.component.html'
})
export class OpenSessionFile implements AfterViewInit {

  @ViewChild('browseFilesButton') browseFilesButton;

  @Output('done') done = new EventEmitter();

  private flow;
  private fileStatus = new Map<any, string>();
  private finishedFiles = new Set<any>();

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

    let session = new Session(file.name.replace('.zip', ''));

    this.fileStatus.set(file, 'Creating session');

    this.sessionResource.createSession(session).subscribe((sessionId) => {
      // progress bar is enough for the upload status
      this.fileStatus.set(file, undefined);
      this.uploadService.startUpload(sessionId, file);
    }, err => {
      this.error(file, err);
    });
  }

  error(file: any, err) {
    this.fileStatus.set(file, err);
    this.finishedFiles.add(file);
    this.errorService.headerError("Failed to open the session file: " + err, true);
  }

  getFiles() {
    return Array.from(this.fileStatus.keys());
  }

  fileSuccess(file: any) {

    let sessionId = file.chipsterSessionId;
    let datasetId = file.chipsterDatasetId;

    // remove from the list
    file.cancel();

    this.fileStatus.set(file, 'Extracting session');
    return this.sessionWorkerResource.extractSession(sessionId, datasetId).flatMap(response => {
      console.log('extracted, warnings: ', response.warnings);
      this.fileStatus.set(file, 'Deleting temporary copy');
      return this.sessionResource.deleteDataset(sessionId, datasetId);
    }).subscribe(() => {
      this.fileStatus.set(file, undefined);
      this.finishedFiles.add(file);

      // let the caller know if this was the last one
      if (this.fileStatus.size === this.finishedFiles.size) {
        let sessionIds = Array.from(this.finishedFiles).map(f => file.chipsterSessionId);
        this.fileStatus.clear();
        this.finishedFiles.clear();
        this.done.emit(sessionIds);
      }
    }, err => {
      this.error(file, err);
      this.sessionResource.deleteSession(sessionId).subscribe();
    });
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
  }

  cancel(file: any) {
    file.cancel();
    this.fileStatus.delete(file);
    this.sessionResource.deleteSession(file.chipsterSessionId).subscribe(() => {
      console.log('session deleted');
    });
  }
}
