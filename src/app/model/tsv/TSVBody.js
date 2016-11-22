"use strict";
var _ = require("lodash");
var TSVRow_1 = require("./TSVRow");
var TSVBody = (function () {
    function TSVBody(tsvBody) {
        this.rows = this.createRows(tsvBody);
    }
    TSVBody.prototype.createRows = function (tsvBody) {
        return _.map(tsvBody, function (row, index) {
            return new TSVRow_1.default(row, index.toString());
        });
    };
    /*
     * Count of bodyrows
     */
    TSVBody.prototype.size = function () {
        return this.rows.length;
    };
    /*
     * Get rows with ids
     */
    TSVBody.prototype.getTSVRows = function (ids) {
        return _.filter(this.rows, function (row) { return _.includes(ids, row.id.toString()); });
    };
    /*
     * Get single tsvRow with ids
     */
    TSVBody.prototype.getTSVRow = function (id) {
        return _.find(this.rows, function (row) { return row.id === id; });
    };
    /*
     * Get original TSVBodyrows with ids
     */
    TSVBody.prototype.getRawDataByRowIds = function (ids) {
        var tsvRows = this.getTSVRows(ids);
        return _.map(tsvRows, function (tsvRow) { return tsvRow.row; });
    };
    return TSVBody;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TSVBody;
//# sourceMappingURL=TSVBody.js.map