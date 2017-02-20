var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectorRef, ViewChild, Output, EventEmitter } from '@angular/core';
import UploadService from "../../../shared/services/upload.service";
import Session from "../../../model/session/session";
import SessionResource from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
export var OpenSessionFile = (function () {
    function OpenSessionFile(uploadService, sessionResource, sessionWorkerResource, changeDetectorRef) {
        this.uploadService = uploadService;
        this.sessionResource = sessionResource;
        this.sessionWorkerResource = sessionWorkerResource;
        this.changeDetectorRef = changeDetectorRef;
        this.openSession = new EventEmitter();
    }
    OpenSessionFile.prototype.ngOnInit = function () {
        this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
    };
    OpenSessionFile.prototype.fileAdded = function (file) {
        var _this = this;
        this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
        this.status = 'Creating session';
        var session = new Session('Opening session file...');
        this.sessionResource.createSession(session).subscribe(function (sessionId) {
            // progress bar is enough for the upload status
            _this.status = undefined;
            _this.uploadService.startUpload(sessionId, file, null);
        });
    };
    OpenSessionFile.prototype.fileSuccess = function (file) {
        var _this = this;
        // remove from the list
        file.cancel();
        var sessionId = file.chipsterSessionId;
        var datasetId = file.chipsterDatasetId;
        this.status = 'Extracting session';
        return this.sessionWorkerResource.extractSession(sessionId, datasetId).flatMap(function (response) {
            console.log('extracted, warnings: ', response.warnings);
            _this.status = 'Deleting temporary copy';
            return _this.sessionResource.deleteDataset(sessionId, datasetId);
        }).subscribe(function () {
            _this.status = undefined;
            _this.openSession.emit(sessionId);
        });
    };
    OpenSessionFile.prototype.ngAfterViewInit = function () {
        this.flow.assignBrowse(this.browseFilesButton);
    };
    OpenSessionFile.prototype.cancel = function (file) {
        file.cancel();
        this.status = undefined;
        this.sessionResource.deleteSession(file.chipsterSessionId).subscribe(function () {
            console.log('session deleted');
        });
    };
    __decorate([
        ViewChild('browseFilesButton'), 
        __metadata('design:type', Object)
    ], OpenSessionFile.prototype, "browseFilesButton", void 0);
    __decorate([
        Output('openSession'), 
        __metadata('design:type', Object)
    ], OpenSessionFile.prototype, "openSession", void 0);
    OpenSessionFile = __decorate([
        Component({
            selector: 'ch-open-session-file',
            templateUrl: './opensessionfile.component.html'
        }), 
        __metadata('design:paramtypes', [UploadService, SessionResource, SessionWorkerResource, ChangeDetectorRef])
    ], OpenSessionFile);
    return OpenSessionFile;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/opensessionfile/opensessionfile.component.js.map