var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import Dataset from "../../../../../model/session/dataset";
import SessionDataService from "../../sessiondata.service";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import DatasetModalService from "../datasetmodal.service";
export var SingleDatasetComponent = (function () {
    function SingleDatasetComponent(sessionDataService, datasetModalService) {
        this.sessionDataService = sessionDataService;
        this.datasetModalService = datasetModalService;
        this.onDelete = new EventEmitter();
    }
    SingleDatasetComponent.prototype.ngOnInit = function () {
        this.sourceJob = this.getSourceJob(this.dataset);
    };
    SingleDatasetComponent.prototype.ngOnChanges = function (changes) {
        this.dataset = changes.dataset.currentValue;
        this.sourceJob = this.getSourceJob(this.dataset);
    };
    SingleDatasetComponent.prototype.renameDataset = function () {
        this.datasetModalService.renameDatasetDialog(this.dataset);
    };
    SingleDatasetComponent.prototype.deleteDatasets = function () {
        this.onDelete.emit();
    };
    SingleDatasetComponent.prototype.exportDatasets = function () {
        this.sessionDataService.exportDatasets([this.dataset]);
    };
    SingleDatasetComponent.prototype.showHistory = function () {
        this.datasetModalService.openDatasetHistoryModal(this.dataset);
    };
    SingleDatasetComponent.prototype.getSourceJob = function (dataset) {
        return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], SingleDatasetComponent.prototype, "dataset", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Map)
    ], SingleDatasetComponent.prototype, "jobs", void 0);
    __decorate([
        Output(), 
        __metadata('design:type', EventEmitter)
    ], SingleDatasetComponent.prototype, "onDelete", void 0);
    SingleDatasetComponent = __decorate([
        Component({
            selector: 'ch-single-dataset',
            templateUrl: './singledataset.html',
            styles: ["\n    .dataset-notes {\n        border: none;\n        width: 100%;\n    }        \n  "]
        }), 
        __metadata('design:paramtypes', [SessionDataService, DatasetModalService])
    ], SingleDatasetComponent);
    return SingleDatasetComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/singledataset/singledataset.component.js.map