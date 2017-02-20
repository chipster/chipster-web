import * as _ from "lodash";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
var TSVFile = (function () {
    function TSVFile(tsv, datasetId, filename) {
        // normalize header-row in tsv-file so that if headers are missing a column
        // or identifier is indicated by an empty string
        this.datasetId = datasetId;
        this.filename = filename;
        var normalizedHeaders = this.getNormalizeHeaders(tsv);
        this.headers = new TSVHeaders(normalizedHeaders);
        this.body = new TSVBody(_.tail(tsv));
        datasetId;
        filename;
    }
    /*
     * @description: return unfiltered tsv-data. Note that data is normalized.
     */
    TSVFile.prototype.getRawData = function () {
        var headers = this.headers.headers;
        var body = this.body.getRawDataRows();
        return [headers].concat(body);
    };
    /*
     * @description: get raw TSVFile-data in its initial form
     */
    TSVFile.prototype.getRawDataByRowIds = function (ids) {
        var headers = this.headers.headers;
        var body = this.body.getRawDataByRowIds(ids);
        return [headers].concat(body);
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
        if (tsv.length <= 1) {
            // have to guess
            return false;
        }
        return tsv[0].length < tsv[1].length;
    };
    return TSVFile;
}());
export default TSVFile;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/tsv/TSVFile.js.map