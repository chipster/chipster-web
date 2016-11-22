"use strict";
var _ = require("lodash");
var TSVRow = (function () {
    function TSVRow(row, id) {
        this.id = id;
        this.row = row;
    }
    TSVRow.prototype.size = function () {
        return this.row.length;
    };
    /*
     * Return new array from row containing items in indexes array
     */
    TSVRow.prototype.getCellsByIndexes = function (indexes) {
        var _this = this;
        return _.map(indexes, function (index) { return _this.getCellByIndex(index); });
    };
    /*
     * @description: return cell with given index
     */
    TSVRow.prototype.getCellByIndex = function (index) {
        return this.row[index];
    };
    return TSVRow;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TSVRow;
//# sourceMappingURL=TSVRow.js.map