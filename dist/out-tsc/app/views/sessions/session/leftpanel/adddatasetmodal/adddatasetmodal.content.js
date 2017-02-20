var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import UploadService from "../../../../../shared/services/upload.service";
export var AddDatasetModalContent = (function () {
    function AddDatasetModalContent(activeModal, uploadService, changeDetectorRef) {
        this.activeModal = activeModal;
        this.uploadService = uploadService;
        this.changeDetectorRef = changeDetectorRef;
    }
    AddDatasetModalContent.prototype.ngOnInit = function () {
        this.flow = this.uploadService.getFlow(this.fileAdded.bind(this), this.fileSuccess.bind(this));
    };
    AddDatasetModalContent.prototype.fileAdded = function (file) {
        this.uploadService.scheduleViewUpdate(this.changeDetectorRef, this.flow);
        this.uploadService.startUpload(this.sessionId, file, this.datasetsMap);
    };
    AddDatasetModalContent.prototype.fileSuccess = function (file) {
        // remove from the list
        file.cancel();
    };
    AddDatasetModalContent.prototype.ngAfterViewInit = function () {
        this.flow.assignBrowse(this.browseFilesButton);
        this.flow.assignBrowse(this.browseDirButton, true);
    };
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], AddDatasetModalContent.prototype, "datasetsMap", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], AddDatasetModalContent.prototype, "sessionId", void 0);
    __decorate([
        ViewChild('browseFilesButton'), 
        __metadata('design:type', Object)
    ], AddDatasetModalContent.prototype, "browseFilesButton", void 0);
    __decorate([
        ViewChild('browseDirButton'), 
        __metadata('design:type', Object)
    ], AddDatasetModalContent.prototype, "browseDirButton", void 0);
    AddDatasetModalContent = __decorate([
        Component({
            selector: 'ch-add-dataset-modal-content',
            templateUrl: './adddatasetmodal.content.html'
        }), 
        __metadata('design:paramtypes', [NgbActiveModal, UploadService, ChangeDetectorRef])
    ], AddDatasetModalContent);
    return AddDatasetModalContent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/adddatasetmodal/adddatasetmodal.content.js.map