var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SelectionService from "../../selection.service";
import SessionDataService from "../../sessiondata.service";
import { Component, Output, EventEmitter } from "@angular/core";
export var DatasetDetailsComponent = (function () {
    function DatasetDetailsComponent(selectionService, SessionDataService) {
        this.selectionService = selectionService;
        this.SessionDataService = SessionDataService;
        this.onDelete = new EventEmitter();
    }
    DatasetDetailsComponent.prototype.deleteDatasets = function () {
        this.onDelete.emit();
    };
    DatasetDetailsComponent.prototype.exportDatasets = function () {
        this.SessionDataService.exportDatasets(this.selectionService.selectedDatasets);
    };
    __decorate([
        Output(), 
        __metadata('design:type', EventEmitter)
    ], DatasetDetailsComponent.prototype, "onDelete", void 0);
    DatasetDetailsComponent = __decorate([
        Component({
            selector: 'ch-dataset-details',
            templateUrl: './datasetdetails.html',
            styleUrls: ['./datasetdetails.less']
        }), 
        __metadata('design:paramtypes', [SelectionService, SessionDataService])
    ], DatasetDetailsComponent);
    return DatasetDetailsComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/datasetdetails/datasetdetails.component.js.map