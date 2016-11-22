"use strict";
function default_1() {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        arr.forEach(function (item) {
            if (item.name.displayName.toLowerCase().indexOf(searchTool.toLowerCase()) !== -1) {
                result.push(item);
            }
        });
        return result;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=tool.filter.js.map