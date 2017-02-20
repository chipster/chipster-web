var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import FileResource from "../resources/fileresource";
import { Injectable } from "@angular/core";
import '../../rxjs-operators';
import TSVFile from "../../model/tsv/TSVFile";
import * as d3 from "d3";
export var TSVReader = (function () {
    function TSVReader(fileResource) {
        this.fileResource = fileResource;
    }
    TSVReader.prototype.getTSV = function (sessionId, datasetId) {
        return this.fileResource.getData(sessionId, datasetId);
    };
    TSVReader.prototype.getTSVFile = function (sessionId, datasetId) {
        return this.fileResource.getData(sessionId, datasetId).map(function (tsvData) {
            var parsedTSVData = d3.tsvParseRows(tsvData.data);
            return new TSVFile(parsedTSVData, datasetId, 'dataset');
        });
    };
    TSVReader = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [FileResource])
    ], TSVReader);
    return TSVReader;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/services/TSVReader.js.map