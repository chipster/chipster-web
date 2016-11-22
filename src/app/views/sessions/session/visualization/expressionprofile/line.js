"use strict";
var point_1 = require("../model/point");
var Line = (function () {
    function Line(lineId, x1, y1, x2, y2) {
        this._lineId = lineId;
        this._start = new point_1.default(x1, y1);
        this._end = new point_1.default(x2, y2);
        this._vx = this._end.x - this._start.x;
        this._vy = this._end.y - this._start.y;
    }
    Object.defineProperty(Line.prototype, "lineId", {
        get: function () {
            return this._lineId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "start", {
        get: function () {
            return this._start;
        },
        set: function (value) {
            this._start = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "end", {
        get: function () {
            return this._end;
        },
        set: function (value) {
            this._end = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "vx", {
        get: function () {
            return this._vx;
        },
        set: function (value) {
            this._vx = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "vy", {
        get: function () {
            return this._vy;
        },
        set: function (value) {
            this._vy = value;
        },
        enumerable: true,
        configurable: true
    });
    return Line;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Line;
//# sourceMappingURL=line.js.map