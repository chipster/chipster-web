"use strict";
var _ = require("lodash");
var TSVHeaders_1 = require("./TSVHeaders");
var TSVBody_1 = require("./TSVBody");
var TSVFile = (function () {
    function TSVFile(tsv, datasetId, filename) {
        this.datasetId = datasetId;
        this.filename = filename;
        // normalize header-row in tsv-file so that if headers are missing a column
        // or identifier is indicated by an empty string
        var normalizedHeaders = this.getNormalizeHeaders(tsv);
        this.headers = new TSVHeaders_1.default(normalizedHeaders);
        this.body = new TSVBody_1.default(_.tail(tsv));
        datasetId;
        filename;
    }
    /*
     * @description: get raw TSVFile-data in its initial
     */
    TSVFile.prototype.getRawDataByRowIds = function (ids) {
        var body = this.body.getRawDataByRowIds(ids);
        var headers = this.headers.headers;
        var data = [headers].concat(body);
        return data;
    };
    /*
     * @description: Get values from TSVbody column by given header-key
     */
    TSVFile.prototype.getColumnDataByHeaderKey = function (key) {
        var columnIndex = this.getColumnIndex(key);
        return this.body.rows.map(function (tsvRow) { return tsvRow.row[columnIndex]; });
    };
    /*
     * @description: get columndata of multiple headers.
     */
    TSVFile.prototype.getColumnDataByHeaderKeys = function (keys) {
        var _this = this;
        var columnIndexes = keys.map(function (key) { return _this.getColumnIndex(key); });
        return this.body.rows.map(function (tsvRow) { return columnIndexes.map(function (index) { return tsvRow.row[index]; }); });
    };
    /*
     * @description: get column index matching
     */
    TSVFile.prototype.getColumnIndex = function (key) {
        return this.headers.getColumnIndexByKey(key);
    };
    TSVFile.prototype.getNormalizeHeaders = function (tsv) {
        var isMissingHeader = this.isMissingHeader(tsv);
        var headers = tsv[0];
        if (isMissingHeader) {
            headers.unshift('identifier');
            return headers;
        }
        if (headers.indexOf(' ') !== -1) {
            headers[headers.indexOf(' ')] = 'identifier';
            return headers;
        }
        return headers;
    };
    TSVFile.prototype.isMissingHeader = function (tsv) {
        return tsv[0].length < tsv[1].length;
    };
    return TSVFile;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TSVFile;
//# sourceMappingURL=TSVFile.js.map
