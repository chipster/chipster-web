import * as _ from "lodash";
import TSVRow from "./TSVRow";
var TSVBody = (function () {
    function TSVBody(tsvBody) {
        this.rows = this.createRows(tsvBody);
    }
    TSVBody.prototype.createRows = function (tsvBody) {
        return _.map(tsvBody, function (row, index) {
            return new TSVRow(row, index.toString());
        });
    };
    /*
     * @description: Count of bodyrows
     */
    TSVBody.prototype.size = function () {
        return this.rows.length;
    };
    /*
     * @description: Get rows with ids
     */
    TSVBody.prototype.getTSVRows = function (ids) {
        return _.filter(this.rows, function (row) { return _.includes(ids, row.id.toString()); });
    };
    /*
     * @description: Get single tsvRow with ids
     */
    TSVBody.prototype.getTSVRow = function (id) {
        return _.find(this.rows, function (row) { return row.id === id; });
    };
    /*
     * @description: return all rows as raw data
     */
    TSVBody.prototype.getRawDataRows = function () {
        return this.rows.map(function (tsvRow) { return tsvRow.row; });
    };
    /*
     * @description: Get original TSVBodyrows with ids
     */
    TSVBody.prototype.getRawDataByRowIds = function (ids) {
        var tsvRows = this.getTSVRows(ids);
        return _.map(tsvRows, function (tsvRow) { return tsvRow.row; });
    };
    return TSVBody;
}());
export default TSVBody;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/tsv/TSVBody.js.map