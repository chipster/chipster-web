var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddDatasetModalContent } from "./adddatasetmodal.content";
export var AddDatasetModalComponent = (function () {
    function AddDatasetModalComponent(modalService) {
        this.modalService = modalService;
    }
    AddDatasetModalComponent.prototype.open = function () {
        var modalRef = this.modalService.open(AddDatasetModalContent, { size: "lg" });
        modalRef.componentInstance.datasetsMap = this.datasetsMap;
        modalRef.componentInstance.sessionId = this.sessionId;
    };
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], AddDatasetModalComponent.prototype, "datasetsMap", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], AddDatasetModalComponent.prototype, "sessionId", void 0);
    AddDatasetModalComponent = __decorate([
        Component({
            selector: 'ch-add-dataset-modal',
            templateUrl: './adddatasetmodal.component.html'
        }), 
        __metadata('design:paramtypes', [NgbModal])
    ], AddDatasetModalComponent);
    return AddDatasetModalComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/adddatasetmodal/adddatasetmodal.component.js.map