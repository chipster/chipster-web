"use strict";
function default_1() {
    return function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
            return '-';
        if (bytes === 0)
            return '';
        if (typeof precision === 'undefined')
            precision = 1;
        if (bytes < 0) {
            // log not defined for negative values
            return bytes;
        }
        // for example, let's convert number 340764 to precision 0
        // we can calculate base 1k logarithm using any other log function
        var log1k = Math.log(bytes) / Math.log(1024); // 1.837...
        var exponent = Math.floor(log1k); // 1
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var unit = units[exponent]; // kB
        var scaled = bytes / Math.pow(1024, exponent); // 332.77...
        var rounded = scaled.toFixed(precision); // 333
        return rounded + ' ' + unit;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=bytes.filter.js.map