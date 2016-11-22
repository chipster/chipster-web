"use strict";
var Rx_1 = require("rxjs/Rx");
var CSVReader = (function () {
    function CSVReader(FileResource) {
        this.FileResource = FileResource;
    }
    CSVReader.prototype.getColumns = function (sessionId, datasetId) {
        return Rx_1.Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
    };
    return CSVReader;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CSVReader;
CSVReader.$inject = ['FileResource'];
//# sourceMappingURL=CSVReader.js.map