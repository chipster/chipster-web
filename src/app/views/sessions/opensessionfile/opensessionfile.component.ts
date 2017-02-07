import {Component, Inject, ChangeDetectorRef, ViewChild} from '@angular/core';
import UploadService from "../../../shared/services/upload.service";
import Session from "../../../model/session/session";
import SessionResource from "../../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../../shared/resources/sessionworker.resource";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-open-session-file',
  templateUrl: './opensessionfile.component.html'
})
export class OpenSessionFile {

  private status;

  @ViewChild('browseFilesButton') browseFilesButton;

  private flow;

  constructor(
    @Inject('UploadService') private uploadService: UploadService,
    @Inject('SessionResource') private sessionResource: SessionResource,
    @Inject('SessionWorkerResource') private sessionWorkerResource: SessionWorkerResource,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.flow = this.uploadService.getFlow(this.getSessionId(), null, this.onChange.bind(this), this.onUploadEnd.bind(this));
  }

  getSessionId() {
    return Observable.defer(() => {
      this.status = 'create session';
      let session = new Session('Opening session file...');
      return this.sessionResource.createSession(session).do(() => {
        // progress bar is enough for the upload status
        this.status = undefined;
      })
    });
  }

  onChange() {
    this.changeDetectorRef.detectChanges();
  }

  onUploadEnd(datasetId: string, sessionId: string) {
    this.status = 'extract session';
    return this.sessionWorkerResource.extractSession(sessionId, datasetId).toPromise().then((warnings) => {
      console.log('extracted, warnings: ', warnings);
      this.status = 'delete temporary copy';
      return this.sessionResource.deleteDataset(sessionId, datasetId).toPromise();
    }).then(() => {
      this.status = undefined;
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
