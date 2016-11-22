"use strict";
function default_1() {
    return function (isoDate) {
        var d = new Date(isoDate);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=isodate.filter.js.map