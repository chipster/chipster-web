import VennDiagramUtils from "../venndiagram/venndiagramutils";
var Circle = (function () {
    function Circle(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    Circle.prototype.equals = function (other) {
        return (this.center.x === other.center.x) && (this.center.y === other.center.y) && (this.radius === other.radius);
    };
    Circle.prototype.containsPoint = function (point) {
        return VennDiagramUtils.distance(this.center, point) <= this.radius;
    };
    return Circle;
}());
export default Circle;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/model/circle.js.map