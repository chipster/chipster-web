"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var point_1 = require("../model/point");
var venndiagramutils_1 = require("./venndiagramutils");
var TwoCircleVennDiagramService = (function () {
    function TwoCircleVennDiagramService() {
    }
    /*
     * @description: Get centerpoints for two ellipses
     */
    TwoCircleVennDiagramService.prototype.getCenterPoints = function (center, ellipseRadius) {
        var halfRadius = ellipseRadius / 2;
        var point1 = new point_1.default(center.x - halfRadius, center.y);
        var point2 = new point_1.default(center.x + halfRadius, center.y);
        return [point1, point2];
    };
    /*
     * @description: select description generator
     */
    TwoCircleVennDiagramService.prototype.getSelectionDescriptor = function (circles, selectionCircles, radius) {
        return selectionCircles.length === 1 ? this.oneSelectedCircleDescriptor(circles, selectionCircles[0], radius) : this.twoSelectedCirclesDescriptor(circles, radius);
    };
    /*
     * @description: get path descriptor for when one circle is selected
     */
    TwoCircleVennDiagramService.prototype.oneSelectedCircleDescriptor = function (circles, selectionCircle, radius) {
        var intersections = venndiagramutils_1.default.getIntersections(circles[0], circles[1]);
        var firstDrawPoint = venndiagramutils_1.default.getRightMostPoint(intersections.point1, intersections.point2, selectionCircle.center);
        var secondDrawPoint = venndiagramutils_1.default.getLeftMostPoint(intersections.point1, intersections.point2, selectionCircle.center);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + " \n        A " + radius + " " + radius + " 0 1 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + " \n        A " + radius + " " + radius + " 0 0 0 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: get path descriptor for when two circles are selected
     */
    TwoCircleVennDiagramService.prototype.twoSelectedCirclesDescriptor = function (circles, radius) {
        var intersections = venndiagramutils_1.default.getIntersections(circles[0], circles[1]);
        return "M " + intersections.point1.x + "," + intersections.point1.y + " \n        A " + radius + "," + radius + " 0 0,1 " + intersections.point2.x + "," + intersections.point2.y + " \n        A " + radius + "," + radius + " 0 0,1 " + intersections.point1.x + "," + intersections.point1.y;
    };
    return TwoCircleVennDiagramService;
}());
TwoCircleVennDiagramService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], TwoCircleVennDiagramService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TwoCircleVennDiagramService;
//# sourceMappingURL=twocirclevenndiagram.service.js.map