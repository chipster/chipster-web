"use strict";
var Interval = (function () {
    function Interval(startIndex, lines, rectangle) {
        this._startIndex = startIndex;
        this._endIndex = startIndex + 1;
        this._lines = lines;
        this._rectangle = rectangle;
    }
    Object.defineProperty(Interval.prototype, "lines", {
        get: function () {
            return this._lines;
        },
        set: function (value) {
            this._lines = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Interval.prototype, "rectangle", {
        get: function () {
            return this._rectangle;
        },
        set: function (value) {
            this._rectangle = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Interval.prototype, "startIndex", {
        get: function () {
            return this._startIndex;
        },
        set: function (value) {
            this._startIndex = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Interval.prototype, "endIndex", {
        get: function () {
            return this._endIndex;
        },
        set: function (value) {
            this._endIndex = value;
        },
        enumerable: true,
        configurable: true
    });
    return Interval;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Interval;
//# sourceMappingURL=interval.js.map