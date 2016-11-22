"use strict";
function default_1() {
    return function (seconds) {
        if (isNaN(parseFloat(seconds)) || !isFinite(seconds))
            return '-';
        if (seconds === 0)
            return '';
        var units = ['seconds', 'minutes', 'hours'], number = Math.floor(Math
            .log(seconds)
            / Math.log(60));
        return (seconds / Math.pow(60, Math.floor(number))).toFixed(0) + ' '
            + units[number];
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=seconds.filter.js.map