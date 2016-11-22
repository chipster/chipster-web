"use strict";
var venndiagramutils_1 = require("../venndiagram/venndiagramutils");
var Circle = (function () {
    function Circle(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    Circle.prototype.equals = function (other) {
        return (this.center.x === other.center.x) && (this.center.y === other.center.y) && (this.radius === other.radius);
    };
    Circle.prototype.containsPoint = function (point) {
        return venndiagramutils_1.default.distance(this.center, point) <= this.radius;
    };
    return Circle;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Circle;
//# sourceMappingURL=circle.js.map