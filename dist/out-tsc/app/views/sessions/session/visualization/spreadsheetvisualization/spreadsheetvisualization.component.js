var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionDataService from "../../sessiondata.service";
import * as d3 from "d3";
import { Input, Component } from "@angular/core";
import TSVFile from "../../../../../model/tsv/TSVFile";
import FileResource from "../../../../../shared/resources/fileresource";
import Dataset from "../../../../../model/session/dataset";
import VisualizationModalService from "../visualizationmodal.service";
export var SpreadsheetVisualizationComponent = (function () {
    function SpreadsheetVisualizationComponent(fileResource, sessionDataService, visualizationModalService) {
        this.fileResource = fileResource;
        this.sessionDataService = sessionDataService;
        this.visualizationModalService = visualizationModalService;
        this.showFullData = false;
        this.fileSizeLimit = 10 * 1024;
        this.dataReady = false;
    }
    SpreadsheetVisualizationComponent.prototype.ngOnInit = function () {
        var _this = this;
        var maxBytes = this.showFullData ? -1 : this.fileSizeLimit;
        this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId, maxBytes).subscribe(function (result) {
            var parsedTSV = d3.tsvParseRows(result);
            // if not full file, remove the last, possibly incomplete line
            // could be the only line, will then show first 0 lines instead of a truncated first line
            if (!_this.isCompleteFile()) {
                parsedTSV.pop();
            }
            _this.lineCount = parsedTSV.length;
            var normalizedTSV = new TSVFile(parsedTSV, _this.dataset.datasetId, 'file');
            var container = document.getElementById('tableContainer');
            new Handsontable(container, SpreadsheetVisualizationComponent.getSettings(normalizedTSV.getRawData()));
            _this.dataReady = true;
        }, function (e) {
            console.error('Fetching TSVData failed', e);
        });
    };
    SpreadsheetVisualizationComponent.prototype.isCompleteFile = function () {
        return this.showFullData;
    };
    SpreadsheetVisualizationComponent.prototype.showAll = function () {
        this.visualizationModalService.openVisualizationModal(this.dataset, 'spreadsheet');
    };
    SpreadsheetVisualizationComponent.getSettings = function (array) {
        var arrayHeight = array.length * 23 + 23; // extra for header-row
        return {
            data: array.slice(1),
            colHeaders: array[0],
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,
            readOnly: true,
            rowHeights: 23,
            height: arrayHeight,
            renderAllRows: false
        };
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], SpreadsheetVisualizationComponent.prototype, "dataset", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Boolean)
    ], SpreadsheetVisualizationComponent.prototype, "showFullData", void 0);
    SpreadsheetVisualizationComponent = __decorate([
        Component({
            selector: 'ch-spreadsheet-visualization',
            template: "\n    <p *ngIf=\"!dataReady\">Loading data...</p>\n\n    <div *ngIf=\"dataReady\">\n      <label *ngIf=\"!isCompleteFile()\">Showing first {{lineCount}} rows</label> \n      <label *ngIf=\"isCompleteFile()\">Showing all {{lineCount}} rows</label>\n      <a *ngIf=\"!isCompleteFile()\" (click)=\"showAll()\" class=\"pull-right\">Show all</a>\n    </div>\n\n    <!-- tableContainer needs to be around or new Handsontable fails, so no ngIf for it -->\n    <div id=\"tableContainer\"></div>\n    "
        }), 
        __metadata('design:paramtypes', [FileResource, SessionDataService, VisualizationModalService])
    ], SpreadsheetVisualizationComponent);
    return SpreadsheetVisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component.js.map