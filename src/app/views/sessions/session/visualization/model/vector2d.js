"use strict";
var Vector2d = (function () {
    function Vector2d(_i, _j) {
        this._i = _i;
        this._j = _j;
        _i;
        _j;
    }
    Object.defineProperty(Vector2d.prototype, "i", {
        get: function () {
            return this._i;
        },
        set: function (value) {
            this._i = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector2d.prototype, "j", {
        get: function () {
            return this._j;
        },
        set: function (value) {
            this._j = value;
        },
        enumerable: true,
        configurable: true
    });
    /*
     * @description: crossproduct of this and other vector.
     * If result is negative this vector must be rotated CW to match the direction of other vector
     */
    Vector2d.prototype.crossProduct = function (other) {
        return ((this.i * other.j) - (this.j * other.i));
    };
    return Vector2d;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vector2d;
//# sourceMappingURL=vector2d.js.map