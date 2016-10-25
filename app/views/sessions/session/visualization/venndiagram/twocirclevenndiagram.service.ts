

import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "./circle";
import VennDiagramUtils from "./venndiagramutils";
import * as _ from 'lodash';

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
    getSelectionDescriptor(circles: Array<Circle>, selectionCircles: Array<Circle>, radius: number, visualizationCenter: Point) {
        return selectionCircles.length === 1 ? this.oneSelectedCircleDescriptor(circles, selectionCircles[0], radius, visualizationCenter) : this.twoSelectedCirclesDescriptor(circles, radius);
    }

    /*
     * @description: get path descriptor for when one circle is selected
     */
    oneSelectedCircleDescriptor(circles: Array<Circle>, selectionCircle: Circle, radius: number, visualizationCenter: Point) {
        let intersections = VennDiagramUtils.getIntersections(circles[0], circles[1]);

        let upperPoint = intersections.getUpperPoint();
        let lowerPoint = intersections.getLowerPoint();

        let isLeftSideCircleSelected = selectionCircle.center.x < visualizationCenter.x;

        let leftSideSelectionDescription = `M ${upperPoint.x},${upperPoint.y} 
        A ${radius}, ${radius}, 0, 1, 0, ${lowerPoint.x},${lowerPoint.y} 
        A ${radius}, ${radius}, 0, 0, 1, ${upperPoint.x},${upperPoint.y}`;

        let rightSideSelectionDescription = `M ${upperPoint.x},${upperPoint.y} 
        A ${radius}, ${radius}, 0, 1, 1, ${lowerPoint.x},${lowerPoint.y} 
        A ${radius}, ${radius}, 0, 0, 0, ${upperPoint.x},${upperPoint.y}`;

        return isLeftSideCircleSelected ? leftSideSelectionDescription : rightSideSelectionDescription;
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