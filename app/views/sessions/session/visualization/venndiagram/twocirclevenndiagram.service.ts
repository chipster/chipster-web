

import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "../model/circle";
import VennDiagramUtils from "./venndiagramutils";
import * as _ from 'lodash';
import VennCircle from "./venncircle";

@Injectable()
export default class TwoCircleVennDiagramService {

    /*
     * @description: Get centerpoints for two ellipses
     */
    getCenterPoints(center: Point, ellipseRadius: number): Array<Point> {
        let halfRadius = ellipseRadius / 2;
        let point1 = new Point( center.x - halfRadius, center.y);
        let point2 = new Point( center.x + halfRadius, center.y);
        return [point1, point2];
    }

    /*
     * @description: select description generator
     */
    getSelectionDescriptor(circles: Array<Circle>, selectionCircles: Array<Circle>, radius: number) {
        return selectionCircles.length === 1 ? this.oneSelectedCircleDescriptor(circles, selectionCircles[0], radius) : this.twoSelectedCirclesDescriptor(circles, radius);
    }

    /*
     * @description: get path descriptor for when one circle is selected
     */
    oneSelectedCircleDescriptor(circles: Array<Circle>, selectionCircle: Circle, radius: number) {
        let intersections = VennDiagramUtils.getIntersections(circles[0], circles[1]);
        let firstDrawPoint = VennDiagramUtils.getRightMostPoint(intersections.point1, intersections.point2, selectionCircle.center);
        let secondDrawPoint = VennDiagramUtils.getLeftMostPoint(intersections.point1, intersections.point2, selectionCircle.center);

        return `M ${firstDrawPoint.x} ${firstDrawPoint.y} 
        A ${radius} ${radius} 0 1 1 ${secondDrawPoint.x} ${secondDrawPoint.y} 
        A ${radius} ${radius} 0 0 0 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
    }

    /*
     * @description: get path descriptor for when two circles are selected
     */
    twoSelectedCirclesDescriptor(circles: Array<Circle>, radius: number) {
        let intersections = VennDiagramUtils.getIntersections(circles[0], circles[1]);

        return `M ${intersections.point1.x},${intersections.point1.y} 
        A ${radius},${radius} 0 0,1 ${intersections.point2.x},${intersections.point2.y} 
        A ${radius},${radius} 0 0,1 ${intersections.point1.x},${intersections.point1.y}`;
    }

}