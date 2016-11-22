"use strict";
var pointpair_1 = require("./pointpair");
var point_1 = require("../model/point");
var vector2d_1 = require("../model/vector2d");
var VennDiagramUtils = (function () {
    function VennDiagramUtils() {
    }
    /*
     * @description: Intersection points of two circles
     */
    VennDiagramUtils.getIntersections = function (circle1, circle2) {
        /* dx and dy are the vertical and horizontal distances between
         * the circle centers.
         */
        var dx = circle2.center.x - circle1.center.x;
        var dy = circle2.center.y - circle1.center.y;
        /* Determine the straight-line distance between the centers. */
        var distance = Math.sqrt((dy * dy) + (dx * dx));
        /* Check if circles do not intersect or circle2 circle is inside ancircle2 */
        if ((distance > (circle1.radius + circle2.radius)) || (distance < Math.abs(circle1.radius - circle2.radius))) {
            return [];
        }
        /* 'point 2' is the point where the line through the circle
         * intersection points crosses the line between the circle
         * centers.
         */
        /* Determine the distance from point 0 to point 2. */
        var a = (Math.pow(circle1.radius, 2) - Math.pow(circle2.radius, 2) + Math.pow(distance, 2)) / (2.0 * distance);
        /* Determine the coordinates of point 2. */
        var x2 = circle1.center.x + (dx * a / distance);
        var y2 = circle1.center.y + (dy * a / distance);
        /* Determine the distance from point 2 to either of the
         * intersection points.
         */
        var h = Math.sqrt(Math.pow(circle1.radius, 2) - Math.pow(a, 2));
        /* Now determine the offsets of the intersection points from
         * point 2.
         */
        var rx = -dy * (h / distance);
        var ry = dx * (h / distance);
        /* Determine the absolute intersection points. */
        var point1 = new point_1.default(x2 + rx, y2 + ry);
        var point2 = new point_1.default(x2 - rx, y2 - ry);
        return new pointpair_1.default(point1, point2);
    };
    /*
     * @description: Distance between two points
     */
    VennDiagramUtils.distance = function (point1, point2) {
        var dx = point1.x - point2.x;
        var dy = point1.y - point2.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    };
    /*
     * @description: Create Vector2d with given start and end points
     */
    VennDiagramUtils.createVector2d = function (from, to) {
        return new vector2d_1.default((to.x - from.x), (to.y - from.y));
    };
    /*
     * @description: Get Circles containing point
     */
    VennDiagramUtils.getCirclesByPosition = function (circles, point) {
        var _this = this;
        return circles.filter(function (vennCircle) { return _this.distance(vennCircle.circle.center, point) <= vennCircle.circle.radius; });
    };
    /*
     * @description: Get rightmost point when comparing with vectors drawn from reference point
     */
    VennDiagramUtils.getRightMostPoint = function (point1, point2, reference) {
        var vector1 = this.createVector2d(reference, point1);
        var vector2 = this.createVector2d(reference, point2);
        return vector1.crossProduct(vector2) < 0 ? point1 : point2;
    };
    /*
     * @description: Get leftmost point when comparing with vectors drawn from reference point
     */
    VennDiagramUtils.getLeftMostPoint = function (point1, point2, reference) {
        var vector1 = this.createVector2d(reference, point1);
        var vector2 = this.createVector2d(reference, point2);
        return vector1.crossProduct(vector2) >= 0 ? point1 : point2;
    };
    /*
     * @description: Get the intersectionpoint of other circles that is inside reference circle
     */
    VennDiagramUtils.getIntersectionPointInsideCircle = function (reference, other1, other2) {
        var intersections = VennDiagramUtils.getIntersections(other1, other2);
        return reference.containsPoint(intersections.point1) ? intersections.point1 : intersections.point2;
    };
    /*
     * @description: Get the intersectionpoint of other circles that is outside reference circle
     */
    VennDiagramUtils.getIntersectionPointOutsideCirle = function (reference, other1, other2) {
        var intersections = VennDiagramUtils.getIntersections(other1, other2);
        return reference.containsPoint(intersections.point1) ? intersections.point2 : intersections.point1;
    };
    return VennDiagramUtils;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VennDiagramUtils;
//# sourceMappingURL=venndiagramutils.js.map