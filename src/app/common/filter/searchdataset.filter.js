"use strict";
/**
 * Filter for searching dataset in dataset list view
 */
function default_1() {
    return function (array, expression) {
        var result = [];
        if (!expression) {
            result = array;
        }
        else {
            array.forEach(function (item) {
                if (item.name.toLowerCase().indexOf(expression.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
        }
        return result;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Filter for searching dataset in dataset list view
 */
exports.default = default_1;
;
//# sourceMappingURL=searchdataset.filter.js.map