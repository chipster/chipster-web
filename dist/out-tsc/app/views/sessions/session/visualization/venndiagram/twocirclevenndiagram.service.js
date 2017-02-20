var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
import Point from "../model/point";
import VennDiagramUtils from "./venndiagramutils";
var TwoCircleVennDiagramService = (function () {
    function TwoCircleVennDiagramService() {
    }
    /*
     * @description: Get centerpoints for two ellipses
     */
    TwoCircleVennDiagramService.prototype.getCenterPoints = function (center, ellipseRadius) {
        var halfRadius = ellipseRadius / 2;
        var point1 = new Point(center.x - halfRadius, center.y);
        var point2 = new Point(center.x + halfRadius, center.y);
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
        var intersections = VennDiagramUtils.getIntersections(circles[0], circles[1]);
        var firstDrawPoint = VennDiagramUtils.getRightMostPoint(intersections.point1, intersections.point2, selectionCircle.center);
        var secondDrawPoint = VennDiagramUtils.getLeftMostPoint(intersections.point1, intersections.point2, selectionCircle.center);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + " \n        A " + radius + " " + radius + " 0 1 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + " \n        A " + radius + " " + radius + " 0 0 0 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: get path descriptor for when two circles are selected
     */
    TwoCircleVennDiagramService.prototype.twoSelectedCirclesDescriptor = function (circles, radius) {
        var intersections = VennDiagramUtils.getIntersections(circles[0], circles[1]);
        return "M " + intersections.point1.x + "," + intersections.point1.y + " \n        A " + radius + "," + radius + " 0 0,1 " + intersections.point2.x + "," + intersections.point2.y + " \n        A " + radius + "," + radius + " 0 0,1 " + intersections.point1.x + "," + intersections.point1.y;
    };
    TwoCircleVennDiagramService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], TwoCircleVennDiagramService);
    return TwoCircleVennDiagramService;
}());
export default TwoCircleVennDiagramService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/twocirclevenndiagram.service.js.map