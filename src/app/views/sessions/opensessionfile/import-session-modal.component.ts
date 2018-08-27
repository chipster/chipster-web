import {Component, OnInit, OnDestroy, Input, ChangeDetectorRef, EventEmitter, Output} from "@angular/core";
import { UploadService } from "../../../shared/services/upload.service";
import { Session } from "chipster-js-common";
import { SessionResource } from "../../../shared/resources/session.resource";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { NgbActiveModal } from "../../../../../node_modules/@ng-bootstrap/ng-bootstrap";


@Component({
    selector: "ch-import-session-modal",
    templateUrl: "./import-session-modal.component.html"

})

export class ImportSessionModalComponent implements OnInit, OnDestroy {
    private flow: any;
    fileStatus = new Map<any, string>();
    finishedFiles = new Set<any>();
    files = [];

    constructor(private uploadService: UploadService,
                private changeDetectorRef: ChangeDetectorRef,
                private sessionResource: SessionResource,
                private errorService: ErrorService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {

    }

    ngOnDestroy() {
    }

    fileAdded(file: any) {
        this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
        const session = new Session(file.name.replace('.zip', ''));

        this.fileStatus.set(file, 'Creating session');

        this.sessionResource.createSession(session).subscribe((sessionId) => {
            // progress bar is enough for the upload status
                    this.fileStatus.set(file, undefined);
                    this.uploadService.startUpload(sessionId, file);
            }, err => {
                this.error(file, err);
         });
}

getFiles() {
    return Array.from(this.fileStatus.keys());
  }

error(file: any, err) {
    this.fileStatus.set(file, err);
    this.finishedFiles.add(file);
    this.errorService.headerError("Failed to open the session file");
}



cancel(file: any) {
    file.cancel();
    this.fileStatus.delete(file);
    this.sessionResource.deleteSession(file.chipsterSessionId).subscribe(() => {
      console.log('session deleted');
    });
  }

  closeModal() {
        this.activeModal.dismiss();
  }






}
