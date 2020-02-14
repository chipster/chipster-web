import { Injectable } from "@angular/core";
import * as _ from "lodash";
import Circle from "../model/circle";
import Point from "../model/point";
import VennDiagramUtils from "./venn-diagram-utils";

@Injectable()
export class ThreeCircleVennDiagramService {
  /*
   * @description: Get centerpoints for three ellipses
   */
  getCenterPoints(center: Point, ellipseRadius: number): Array<Point> {
    const halfRadius = ellipseRadius / 2;
    const point1 = new Point(center.x - halfRadius, center.y + halfRadius);
    const point2 = new Point(center.x + halfRadius, center.y + halfRadius);
    const point3 = new Point(center.x, center.y - halfRadius);
    return [point1, point2, point3];
  }

  /*
   *
   */
  getSelectionDescriptor(
    circles: Array<Circle>,
    selectionCrossingCircles: Array<Circle>,
    radius: number,
    visualizationCenter: Point
  ): string {
    if (selectionCrossingCircles.length === 1) {
      return this.oneCircleSelectionDescriptor(
        circles,
        selectionCrossingCircles[0],
        radius
      );
    } else if (selectionCrossingCircles.length === 2) {
      return this.twoCircleSelectionDescriptor(
        circles,
        selectionCrossingCircles,
        radius,
        visualizationCenter
      );
    } else {
      return this.threeCircleSelectionDescriptor(
        circles,
        radius,
        visualizationCenter
      );
    }
  }

  /*
   * @description: return svg path descriptor for area that includes one circle minus the areas of two other circles
   */
  oneCircleSelectionDescriptor(
    circles: Array<Circle>,
    selectionCircle: Circle,
    radius: number
  ): string {
    const otherCircles = circles.filter(
      (circle: Circle) => !circle.equals(selectionCircle)
    );
    const firstCandidate = otherCircles[0];
    const secondCandidate = otherCircles[1];

    const firstIntersections = VennDiagramUtils.getIntersections(
      firstCandidate,
      selectionCircle
    );
    const secondIntersections = VennDiagramUtils.getIntersections(
      secondCandidate,
      selectionCircle
    );

    const firstRightMostPoint = VennDiagramUtils.getRightMostPoint(
      firstIntersections.point1,
      firstIntersections.point2,
      selectionCircle.center
    );
    const firstLeftMostPoint = VennDiagramUtils.getLeftMostPoint(
      firstIntersections.point1,
      firstIntersections.point2,
      selectionCircle.center
    );

    const secondRightMostPoint = VennDiagramUtils.getRightMostPoint(
      secondIntersections.point1,
      secondIntersections.point2,
      selectionCircle.center
    );
    const secondLeftMostPoint = VennDiagramUtils.getLeftMostPoint(
      secondIntersections.point1,
      secondIntersections.point2,
      selectionCircle.center
    );

    const firstDrawPoint = VennDiagramUtils.getRightMostPoint(
      firstRightMostPoint,
      secondRightMostPoint,
      selectionCircle.center
    );
    const secondDrawPoint = VennDiagramUtils.getLeftMostPoint(
      firstLeftMostPoint,
      secondLeftMostPoint,
      selectionCircle.center
    );

    const thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      selectionCircle,
      firstCandidate,
      secondCandidate
    );

    return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
                A ${radius} ${radius} 0 1 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
  }

  /*
   * @description: return svg path descriptor for area that is the intersection of two circles minus the third circlearea
   */
  twoCircleSelectionDescriptor(
    circles: Array<Circle>,
    selectionCircles: Array<Circle>,
    radius: number,
    visualizationCenter: Point
  ): string {
    const circle1 = selectionCircles[0];
    const circle2 = selectionCircles[1];
    const noSelectionCircle = _.first(
      circles.filter((circle: Circle) => !_.includes(selectionCircles, circle))
    );

    const firstDrawPoint = VennDiagramUtils.getIntersectionPointOutsideCirle(
      noSelectionCircle,
      circle1,
      circle2
    );

    const rightSideCircle = this.isRightSideCircle(
      firstDrawPoint,
      visualizationCenter,
      circle1
    )
      ? circle1
      : circle2;
    const leftSideCircle =
      rightSideCircle.center === circle1.center ? circle2 : circle1;

    const secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      leftSideCircle,
      rightSideCircle,
      noSelectionCircle
    );
    const thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      rightSideCircle,
      leftSideCircle,
      noSelectionCircle
    );

    return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
                A ${radius} ${radius} 0 0 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
                A ${radius} ${radius} 0 0 0 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
                A ${radius} ${radius} 0 0 1 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
  }

  /*
   * @description: return svg path descriptor for area that is the intersection of all the three circles
   */
  threeCircleSelectionDescriptor(
    circles: Array<Circle>,
    radius: number,
    visualizationCenter: Point
  ): string {
    const firstCircle = circles[0];
    const secondCircle = circles[1];
    const thirdCircle = circles[2];

    const firstDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      firstCircle,
      secondCircle,
      thirdCircle
    );
    const rightSideCircle = this.isRightSideCircle(
      firstDrawPoint,
      visualizationCenter,
      secondCircle
    )
      ? secondCircle
      : thirdCircle;
    const leftSideCircle =
      rightSideCircle.center === secondCircle.center
        ? thirdCircle
        : secondCircle;
    const secondDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      leftSideCircle,
      firstCircle,
      rightSideCircle
    );
    const thirdDrawPoint = VennDiagramUtils.getIntersectionPointInsideCircle(
      rightSideCircle,
      leftSideCircle,
      firstCircle
    );

    return `M ${firstDrawPoint.x} ${firstDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${secondDrawPoint.x} ${secondDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${thirdDrawPoint.x} ${thirdDrawPoint.y}
            A ${radius} ${radius} 0 0 1 ${firstDrawPoint.x} ${firstDrawPoint.y}`;
  }

  isRightSideCircle(
    referencePoint: Point,
    visualizationCenter: Point,
    circle1: Circle
  ): boolean {
    const referenceVector = VennDiagramUtils.createVector2d(
      referencePoint,
      visualizationCenter
    );
    const circleCenterVector = VennDiagramUtils.createVector2d(
      referencePoint,
      circle1.center
    );
    return referenceVector.crossProduct(circleCenterVector) >= 0;
  }
}
