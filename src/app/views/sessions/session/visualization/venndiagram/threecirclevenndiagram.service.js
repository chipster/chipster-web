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
var _ = require("lodash");
var ThreeCircleVennDiagramService = (function () {
    function ThreeCircleVennDiagramService() {
    }
    /*
     * @description: Get centerpoints for three ellipses
     */
    ThreeCircleVennDiagramService.prototype.getCenterPoints = function (center, ellipseRadius) {
        var halfRadius = ellipseRadius / 2;
        var point1 = new point_1.default(center.x - halfRadius, center.y + halfRadius);
        var point2 = new point_1.default(center.x + halfRadius, center.y + halfRadius);
        var point3 = new point_1.default(center.x, center.y - halfRadius);
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
        var firstIntersections = venndiagramutils_1.default.getIntersections(firstCandidate, selectionCircle);
        var secondIntersections = venndiagramutils_1.default.getIntersections(secondCandidate, selectionCircle);
        var firstRightMostPoint = venndiagramutils_1.default.getRightMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);
        var firstLeftMostPoint = venndiagramutils_1.default.getLeftMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);
        var secondRightMostPoint = venndiagramutils_1.default.getRightMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);
        var secondLeftMostPoint = venndiagramutils_1.default.getLeftMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);
        var firstDrawPoint = venndiagramutils_1.default.getRightMostPoint(firstRightMostPoint, secondRightMostPoint, selectionCircle.center);
        var secondDrawPoint = venndiagramutils_1.default.getLeftMostPoint(firstLeftMostPoint, secondLeftMostPoint, selectionCircle.center);
        var thirdDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(selectionCircle, firstCandidate, secondCandidate);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n                A " + radius + " " + radius + " 0 1 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: return svg path descriptor for area that is the intersection of two circles minus the third circlearea
     */
    ThreeCircleVennDiagramService.prototype.twoCircleSelectionDescriptor = function (circles, selectionCircles, radius, visualizationCenter) {
        var circle1 = selectionCircles[0];
        var circle2 = selectionCircles[1];
        var noSelectionCircle = _.first(circles.filter(function (circle) { return !_.includes(selectionCircles, circle); }));
        var firstDrawPoint = venndiagramutils_1.default.getIntersectionPointOutsideCirle(noSelectionCircle, circle1, circle2);
        var rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, circle1) ? circle1 : circle2;
        var leftSideCircle = (rightSideCircle.center === circle1.center) ? circle2 : circle1;
        var secondDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(leftSideCircle, rightSideCircle, noSelectionCircle);
        var thirdDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, noSelectionCircle);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 0 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n                A " + radius + " " + radius + " 0 0 1 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    /*
     * @description: return svg path descriptor for area that is the intersection of all the three circles
     */
    ThreeCircleVennDiagramService.prototype.threeCircleSelectionDescriptor = function (circles, radius, visualizationCenter) {
        var firstCircle = circles[0];
        var secondCircle = circles[1];
        var thirdCircle = circles[2];
        var firstDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(firstCircle, secondCircle, thirdCircle);
        var rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, secondCircle) ? secondCircle : thirdCircle;
        var leftSideCircle = (rightSideCircle.center === secondCircle.center) ? thirdCircle : secondCircle;
        var secondDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(leftSideCircle, firstCircle, rightSideCircle);
        var thirdDrawPoint = venndiagramutils_1.default.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, firstCircle);
        return "M " + firstDrawPoint.x + " " + firstDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + secondDrawPoint.x + " " + secondDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + thirdDrawPoint.x + " " + thirdDrawPoint.y + "\n            A " + radius + " " + radius + " 0 0 1 " + firstDrawPoint.x + " " + firstDrawPoint.y;
    };
    ThreeCircleVennDiagramService.prototype.isRightSideCircle = function (referencePoint, visualizationCenter, circle1) {
        var referenceVector = venndiagramutils_1.default.createVector2d(referencePoint, visualizationCenter);
        var circleCenterVector = venndiagramutils_1.default.createVector2d(referencePoint, circle1.center);
        return referenceVector.crossProduct(circleCenterVector) >= 0;
    };
    return ThreeCircleVennDiagramService;
}());
ThreeCircleVennDiagramService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], ThreeCircleVennDiagramService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ThreeCircleVennDiagramService;
//# sourceMappingURL=threecirclevenndiagram.service.js.map