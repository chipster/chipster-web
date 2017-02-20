import * as _ from "lodash";
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
export default TSVRow;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/tsv/TSVRow.js.map