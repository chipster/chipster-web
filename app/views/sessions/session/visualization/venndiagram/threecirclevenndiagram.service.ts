
import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "./circle";
import VennDiagramUtils from "./venndiagramutils";
import VennCircle from "./venncircle";

@Injectable()
export default class ThreeCircleVennDiagramService {

    /*
     * @description: Get centerpoints for three ellipses
     */
    getCenterPoints(center: Point, ellipseRadius: number): Array<Point>{
        let halfRadius = ellipseRadius / 2;
        let point1 = new Point( center.x - halfRadius, center.y + halfRadius);
        let point2 = new Point( center.x + halfRadius, center.y + halfRadius);
        let point3 = new Point( center.x, center.y - halfRadius);
        return [point1, point2, point3];
    }

    /*
     *
     */
    getSelectionDescriptor(circles: Array<Circle>, selectionCrossingCircles: Array<Circle>, radius: number, visualizationCenter: Point): string {
        if(selectionCrossingCircles.length === 1 ) {
            return this.oneCircleSelectionDescriptor(circles, selectionCrossingCircles[0], radius);
        } else if(selectionCrossingCircles.length === 2) {
            return this.twoCircleSelectionDescriptor(circles, selectionCrossingCircles, radius, visualizationCenter);
        } else {
            return this.threeCircleSelectionDescriptor(circles, radius, visualizationCenter);
        }

    }

    /*
     * @description: return svg path descriptor for area that includes one circle minus the areas of two other circles
     */
    oneCircleSelectionDescriptor(circles: Array<Circle>, selectionCircle: Circle, radius: number): string {
        let otherCircles = circles.filter( (circle: Circle) => !circle.equals(selectionCircle));
        let firstCandidate = otherCircles[0];
        let secondCandidate = otherCircles[1];

        let firstIntersections = VennDiagramUtils.getIntersections(firstCandidate, selectionCircle);
        let secondIntersections = VennDiagramUtils.getIntersections(secondCandidate, selectionCircle);

        let firstRightMostPoint = VennDiagramUtils.getRightMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);
        let firstLeftMostPoint = VennDiagramUtils.getLeftMostPoint(firstIntersections.point1, firstIntersections.point2, selectionCircle.center);

        let secondRightMostPoint = VennDiagramUtils.getRightMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);
        let secondLeftMostPoint = VennDiagramUtils.getLeftMostPoint(secondIntersections.point1, secondIntersections.point2, selectionCircle.center);

        let firstDrawPoint = VennDiagramUtils.getRightMostPoint(firstRightMostPoint, secondRightMostPoint, selectionCircle.center);
        let secondDrawPoint = VennDiagramUtils.getLeftMostPoint(firstLeftMostPoint, secondLeftMostPoint, selectionCircle.center);

        let thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(selectionCircle, firstCandidate, secondCandidate);

        return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
                A ${radius} ${radius} 0 1 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
    }

    /*
     * @description: return svg path descriptor for area that is the intersection of two circles minus the third circlearea
     */
    twoCircleSelectionDescriptor(circles: Array<Circle>, selectionCircles: Array<Circle>, radius: number, visualizationCenter: Point): string {

        let circle1 = selectionCircles[0];
        let circle2 = selectionCircles[1];
        let noSelectionCircle = _.first(circles.filter( (circle: Circle) => !_.includes(selectionCircles, circle)));

        let firstDrawPoint = VennDiagramUtils.getIntersectionPointOutsideCirle(noSelectionCircle, circle1, circle2);

        let rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, circle1) ? circle1 : circle2;
        let leftSideCircle = (rightSideCircle.center === circle1.center) ? circle2 : circle1;

        let secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(leftSideCircle, rightSideCircle, noSelectionCircle);
        let thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, noSelectionCircle);

        return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
                A ${radius} ${radius} 0 0 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
                A ${radius} ${radius} 0 0 1 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
    }

    /*
     * 
     */
    threeCircleSelectionDescriptor(circles: Array<Circle>, radius: number, visualizationCenter: Point): string {
        let firstCircle = circles[0];
        let secondCircle = circles[1];
        let thirdCircle = circles[2];

        let firstDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(firstCircle, secondCircle, thirdCircle);
        let rightSideCircle = this.isRightSideCircle(firstDrawPoint, visualizationCenter, secondCircle) ? secondCircle : thirdCircle;
        let leftSideCircle = (rightSideCircle.center === secondCircle.center) ? thirdCircle : secondCircle;
        let secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(leftSideCircle, firstCircle, rightSideCircle);
        let thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(rightSideCircle, leftSideCircle, firstCircle);

        return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${firstDrawPoint.x} ${firstDrawPoint.y}`;

    }

    isRightSideCircle(referencePoint: Point, visualizationCenter: Point, circle1: Circle): boolean {
        let referenceVector = VennDiagramUtils.createVector2d(referencePoint, visualizationCenter);
        let circleCenterVector = VennDiagramUtils.createVector2d(referencePoint, circle1.center);
        return referenceVector.crossProduct(circleCenterVector) >= 0;
    }

}