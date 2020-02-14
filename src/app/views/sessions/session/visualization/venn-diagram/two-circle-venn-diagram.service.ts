import { Injectable } from "@angular/core";
import Circle from "../model/circle";
import Point from "../model/point";
import VennDiagramUtils from "./venn-diagram-utils";

@Injectable()
export class TwoCircleVennDiagramService {
  /*
   * @description: Get centerpoints for two ellipses
   */
  getCenterPoints(center: Point, ellipseRadius: number): Array<Point> {
    const halfRadius = ellipseRadius / 2;
    const point1 = new Point(center.x - halfRadius, center.y);
    const point2 = new Point(center.x + halfRadius, center.y);
    return [point1, point2];
  }

  /*
   * @description: select description generator
   */
  getSelectionDescriptor(
    circles: Array<Circle>,
    selectionCircles: Array<Circle>,
    radius: number
  ) {
    return selectionCircles.length === 1
      ? this.oneSelectedCircleDescriptor(circles, selectionCircles[0], radius)
      : this.twoSelectedCirclesDescriptor(circles, radius);
  }

  /*
   * @description: get path descriptor for when one circle is selected
   */
  oneSelectedCircleDescriptor(
    circles: Array<Circle>,
    selectionCircle: Circle,
    radius: number
  ) {
    const intersections = VennDiagramUtils.getIntersections(
      circles[0],
      circles[1]
    );
    const firstDrawPoint = VennDiagramUtils.getRightMostPoint(
      intersections.point1,
      intersections.point2,
      selectionCircle.center
    );
    const secondDrawPoint = VennDiagramUtils.getLeftMostPoint(
      intersections.point1,
      intersections.point2,
      selectionCircle.center
    );

    return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
        A ${radius} ${radius} 0 1 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
        A ${radius} ${radius} 0 0 0 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
  }

  /*
   * @description: get path descriptor for when two circles are selected
   */
  twoSelectedCirclesDescriptor(circles: Array<Circle>, radius: number) {
    const intersections = VennDiagramUtils.getIntersections(
      circles[0],
      circles[1]
    );

    return `M ${intersections.point1.x},${intersections.point1.y}
        A ${radius},${radius} 0 0,1 ${intersections.point2.x},${intersections.point2.y}
        A ${radius},${radius} 0 0,1 ${intersections.point1.x},${intersections.point1.y}`;
  }
}
