"use strict";
function categoryFilter($filter) {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        arr.forEach(function (category) {
            var filteredTools = $filter('toolFilter')(category.tools, searchTool);
            if (filteredTools.length > 0) {
                result.push(category);
            }
        });
        return result;
    };
}
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = categoryFilter;
//# sourceMappingURL=category.filter.js.map