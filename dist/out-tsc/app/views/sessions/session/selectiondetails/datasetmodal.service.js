var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import SessionDataService from "../sessiondata.service";
import { DatasetHistorymodalComponent } from "./datasethistorymodal/datasethistorymodal.component";
var DatasetModalService = (function () {
    function DatasetModalService(ngbModal, sessionDataService) {
        this.ngbModal = ngbModal;
        this.sessionDataService = sessionDataService;
    }
    DatasetModalService.prototype.renameDatasetDialog = function (dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        this.sessionDataService.updateDataset(dataset);
    };
    DatasetModalService.prototype.openDatasetHistoryModal = function (dataset) {
        var modalRef = this.ngbModal.open(DatasetHistorymodalComponent, { size: "lg" });
        modalRef.componentInstance.dataset = dataset;
    };
    DatasetModalService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [NgbModal, SessionDataService])
    ], DatasetModalService);
    return DatasetModalService;
}());
export default DatasetModalService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/datasetmodal.service.js.map