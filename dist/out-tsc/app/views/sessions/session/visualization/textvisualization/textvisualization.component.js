var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import FileResource from "../../../../../shared/resources/fileresource";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import { Component, Input } from "@angular/core";
import VisualizationModalService from "../visualizationmodal.service";
export var TextVisualizationComponent = (function () {
    function TextVisualizationComponent(fileResource, sessionDataService, visualizationModalService) {
        this.fileResource = fileResource;
        this.sessionDataService = sessionDataService;
        this.visualizationModalService = visualizationModalService;
        this.fileSizeLimit = 10 * 1024;
    }
    TextVisualizationComponent.prototype.ngOnInit = function () {
        var _this = this;
        var maxBytes = this.showFullData ? -1 : this.fileSizeLimit;
        this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId, maxBytes).subscribe(function (response) {
            _this.data = response;
        }, function (error) {
            console.error(error);
        });
    };
    TextVisualizationComponent.prototype.getSizeShown = function () {
        if (this.data) {
            return this.data.length;
        }
    };
    TextVisualizationComponent.prototype.getSizeFull = function () {
        return this.dataset.size;
    };
    TextVisualizationComponent.prototype.isCompleteFile = function () {
        return this.getSizeShown() === this.getSizeFull();
    };
    TextVisualizationComponent.prototype.showAll = function () {
        this.visualizationModalService.openVisualizationModal(this.dataset, 'text');
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], TextVisualizationComponent.prototype, "dataset", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Boolean)
    ], TextVisualizationComponent.prototype, "showFullData", void 0);
    TextVisualizationComponent = __decorate([
        Component({
            selector: 'ch-text-visualization',
            template: "\n    <p *ngIf=\"!data\">Loading data...</p>\n    \n    <div *ngIf=\"data\">\n      <label *ngIf=\"!isCompleteFile()\">Showing {{getSizeShown() | bytes}} of {{getSizeFull() | bytes}}</label>\n      <a class=\"pull-right\" (click)=\"showAll()\" *ngIf=\"!isCompleteFile()\">Show all</a>\n      <pre>{{data}}</pre>\n    </div>\n  ",
            styles: ["\n    pre {\n      background-color: white;\n    }\n  "],
        }), 
        __metadata('design:paramtypes', [FileResource, SessionDataService, VisualizationModalService])
    ], TextVisualizationComponent);
    return TextVisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/textvisualization/textvisualization.component.js.map