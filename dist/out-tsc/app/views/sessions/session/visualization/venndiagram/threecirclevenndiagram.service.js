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
import * as _ from "lodash";
var ThreeCircleVennDiagramService = (function () {
    function ThreeCircleVennDiagramService() {
    }
    /*
     * @description: Get centerpoints for three ellipses
     */
    ThreeCircleVennDiagramService.prototype.getCenterPoints = function (center, ellipseRadius) {
        var halfRadius = ellipseRadius / 2;
        var point1 = new Point(center.x - halfRadius, center.y + halfRadius);
        var point2 = new Point(center.x + halfRadius, center.y + halfRadius);
        var point3 = new Point(center.x, center.y - halfRadius);
        return [point1, point2, point3];
    };
    /*
     *
     */
    ThreeCircleVennDiagramService.prototype.getSelectionDescriptor = function (circles, selectionCrossingCircles, radius, visualizationCenter) {
        if (selectionCrossingCircles.length === 1) {
            return this.oneCircleSelectionDescriptor(circles, selectionCrossingCircles[0], radius);
        }
        else if (selectionCrossingCircles.length === 2) {
            return this.twoCircleSelectionDescriptor(circles, selectionCrossingCircles, radius, visualizationCenter);
        }
        else {
            return this.threeCircleSelectionDescriptor(circles, radius, visualizationCenter);
        }
    };
    /*
     * @description: return svg path descriptor for area that includes one circle minus the areas of two other circles
     */
    ThreeCircleVennDiagramService.prototype.oneCircleSelectionDescriptor = function (circles, selectionCircle, radius) {
        var otherCircles = circles.filter(function (circle) { return !circle.equals(selectionCircle); });
        var firstCandidate = otherCircles[0];
        var secondCandidate = otherCircles[1];
        var firstIntersections = VennDiagramUtils.getIntersections(firstCandidate, selectionCircle);
        var secondIntersections = VennDiagramUtils.getIntersections(secondCandidate, selectionCircle);
        var firstRightMostPoint = VennDiagramUtils.getRightMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);
        var firstLeftMostPoint = VennDiagramUtils.getLeftMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);
        var secondRightMostPoint = VennDiagramUtils.getRightMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);
        var secondLeftMostPoint = VennDiagramUtils.getLeftMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);
        var firstDrawPoint = VennDiagramUtils.getRightMostPoint(firstRightMostPoint, secondRightMostPoint, selectionCircle.center);
        var secondDrawPoint = VennDiagramUtils.getLeftMostPoint(firstLeftMostPoint, secondLeftMostPoint, selectionCircle.center);
        var thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(selectionCircle, firstCandidate, secondCandidate);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n                A " + radius + " " + radius + " 0 1 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: return svg path descriptor for area that is the intersection of two circles minus the third circlearea
     */
    ThreeCircleVennDiagramService.prototype.twoCircleSelectionDescriptor = function (circles, selectionCircles, radius, visualizationCenter) {
        var circle1 = selectionCircles[0];
        var circle2 = selectionCircles[1];
        var noSelectionCircle = _.first(circles.filter(function (circle) { return !_.includes(selectionCircles, circle); }));
        var firstDrawPoint = VennDiagramUtils.getIntersectionPointOutsideCirle(noSelectionCircle, circle1, circle2);
        var rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, circle1) ? circle1 : circle2;
        var leftSideCircle = (rightSideCircle.center === circle1.center) ? circle2 : circle1;
        var secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(leftSideCircle, rightSideCircle, noSelectionCircle);
        var thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, noSelectionCircle);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 1 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: return svg path descriptor for area that is the intersection of all the three circles
     */
    ThreeCircleVennDiagramService.prototype.threeCircleSelectionDescriptor = function (circles, radius, visualizationCenter) {
        var firstCircle = circles[0];
        var secondCircle = circles[1];
        var thirdCircle = circles[2];
        var firstDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(firstCircle, secondCircle, thirdCircle);
        var rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, secondCircle) ? secondCircle : thirdCircle;
        var leftSideCircle = (rightSideCircle.center === secondCircle.center) ? thirdCircle : secondCircle;
        var secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(leftSideCircle, firstCircle, rightSideCircle);
        var thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, firstCircle);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    ThreeCircleVennDiagramService.prototype.isRightSideCircle = function (referencePoint, visualizationCenter, circle1) {
        var referenceVector = VennDiagramUtils.createVector2d(referencePoint, visualizationCenter);
        var circleCenterVector = VennDiagramUtils.createVector2d(referencePoint, circle1.center);
        return referenceVector.crossProduct(circleCenterVector) >= 0;
    };
    ThreeCircleVennDiagramService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], ThreeCircleVennDiagramService);
    return ThreeCircleVennDiagramService;
}());
export default ThreeCircleVennDiagramService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/threecirclevenndiagram.service.js.map