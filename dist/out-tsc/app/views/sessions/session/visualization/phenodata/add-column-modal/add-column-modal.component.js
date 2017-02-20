var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
export var AddColumnModalComponent = (function () {
    function AddColumnModalComponent(modalService) {
        this.modalService = modalService;
    }
    AddColumnModalComponent.prototype.open = function () {
        this.modalRef = this.modalService.open(this.addColumnModalRef);
    };
    AddColumnModalComponent.prototype.addColumn = function () {
        var colHeaders = this.handsOnTable.getSettings().colHeaders;
        this.handsOnTable.alter('insert_col', colHeaders.length);
        // remove undefined column header
        colHeaders.pop();
        colHeaders.push(this.colName);
        this.handsOnTable.updateSettings({
            colHeaders: colHeaders
        }, false);
        this.colName = '';
        this.modalRef.close();
    };
    __decorate([
        Input(), 
        __metadata('design:type', Object)
    ], AddColumnModalComponent.prototype, "handsOnTable", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], AddColumnModalComponent.prototype, "colName", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], AddColumnModalComponent.prototype, "datasets", void 0);
    __decorate([
        ViewChild('addColumnModalRef'), 
        __metadata('design:type', ElementRef)
    ], AddColumnModalComponent.prototype, "addColumnModalRef", void 0);
    AddColumnModalComponent = __decorate([
        Component({
            selector: 'ch-add-column-modal',
            templateUrl: './add-column-modal.component.html',
            styleUrls: ['./add-column-modal.component.less']
        }), 
        __metadata('design:paramtypes', [NgbModal])
    ], AddColumnModalComponent);
    return AddColumnModalComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/phenodata/add-column-modal/add-column-modal.component.js.map