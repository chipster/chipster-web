"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var fileresource_1 = require("../resources/fileresource");
var core_1 = require("@angular/core");
var Rx_1 = require("rxjs/Rx");
require("../rxjs-operators");
var TSVFile_1 = require("../model/tsv/TSVFile");
var d3 = require("d3");
var TSVReader = (function () {
    function TSVReader(FileResource) {
        this.FileResource = FileResource;
    }
    TSVReader.prototype.getTSV = function (sessionId, datasetId) {
        return Rx_1.Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
    };
    TSVReader.prototype.getTSVFile = function (sessionId, datasetId) {
        return this.getTSV(sessionId, datasetId).map(function (tsvData) {
            var parsedTSVData = d3.tsv.parseRows(tsvData.data);
            return new TSVFile_1.default(parsedTSVData, datasetId, 'dataset');
        });
    };
    return TSVReader;
}());
TSVReader = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject('FileResource')),
    __metadata("design:paramtypes", [fileresource_1.default])
], TSVReader);
exports.TSVReader = TSVReader;
//# sourceMappingURL=TSVReader.js.map