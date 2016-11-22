"use strict";
function default_1($filter) {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        arr.forEach(function (module) {
            var filteredTools = $filter('categoryFilter')(module.categories, searchTool);
            if (filteredTools.length > 0) {
                result.push(module);
            }
        });
        return result;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=module.filter.js.map