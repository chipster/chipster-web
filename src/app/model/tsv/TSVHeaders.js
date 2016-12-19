"use strict";
var _ = require("lodash");
var TSVHeaders = (function () {
    function TSVHeaders(headers) {
        // headers containing 'index' by default. Index is used to indentificate TSVBody's data later
        this.headers = headers;
    }
    TSVHeaders.prototype.size = function () {
        return this.headers.length;
    };
    /*
     * @description: Filter unwanted cells from row
     */
    TSVHeaders.prototype.getItemsByIndexes = function (indexes) {
        var _this = this;
        return _.map(indexes, function (index) { return _this.headers[index]; });
    };
    /*
     * @description: Get index for the key
     * @return: index of header and -1 if not found
     */
    TSVHeaders.prototype.getColumnIndexByKey = function (key) {
        return _.findIndex(this.headers, function (header) { return header === key; });
    };
    /*
     * @description: does headers contain identifier cell
     */
    TSVHeaders.prototype.hasIdentifierColumn = function () {
        return _.includes(this.headers, 'identifier');
    };
    return TSVHeaders;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TSVHeaders;
//# sourceMappingURL=TSVHeaders.js.map