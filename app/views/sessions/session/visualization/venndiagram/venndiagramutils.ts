
import Circle from "../model/circle";
import PointPair from "./pointpair";
import Point from "../model/point";
import Vector2d from "../model/vector2d";
import VennCircle from "./venncircle";
export default class VennDiagramUtils {

    /*
     * @description: Intersection points of two circles
     */
    static getIntersections(circle1: Circle, circle2: Circle): PointPair {

        /* dx and dy are the vertical and horizontal distances between
         * the circle centers.
         */
        let dx = circle2.center.x - circle1.center.x;
        let dy = circle2.center.y - circle1.center.y;

        /* Determine the straight-line distance between the centers. */
        let distance = Math.sqrt((dy*dy) + (dx*dx));

        /* Check if circles do not intersect or circle2 circle is inside ancircle2 */
        if ( (distance > (circle1.radius + circle2.radius)) || (distance < Math.abs(circle1.radius - circle2.radius)) ) {
            return [];
        }

        /* 'point 2' is the point where the line through the circle
         * intersection points crosses the line between the circle
         * centers.
         */

        /* Determine the distance from point 0 to point 2. */
        let a = ( Math.pow(circle1.radius, 2) - Math.pow(circle2.radius, 2) + Math.pow(distance, 2)) / (2.0 * distance) ;

        /* Determine the coordinates of point 2. */
        let x2 = circle1.center.x + (dx * a/distance);
        let y2 = circle1.center.y + (dy * a/distance);

        /* Determine the distance from point 2 to either of the
         * intersection points.
         */
        let h = Math.sqrt( Math.pow(circle1.radius, 2) - Math.pow(a,2));

        /* Now determine the offsets of the intersection points from
         * point 2.
         */
        let rx = -dy * (h/distance);
        let ry = dx * (h/distance);

        /* Determine the absolute intersection points. */

        let point1 = new Point(x2 + rx, y2 + ry);
        let point2 = new Point(x2 - rx, y2 - ry);

        return new PointPair(point1, point2);
    }

    /*
     * @description: Distance between two points
     */
    static distance(point1: Point, point2: Point): number {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt( (dx * dx) + (dy*dy) );
    }

    /*
     * @description: Create Vector2d with given start and end points
     */
    static createVector2d(from: Point, to: Point): Vector2d {
        return new Vector2d( (to.x - from.x), (to.y - from.y));
    }

    /*
     * @description: Get Circles containing point
     */
    static getCirclesByPosition(circles: Array<VennCircle>, point: Point): Array<VennCircle> {
        return circles.filter( (vennCircle: VennCircle) => this.distance(vennCircle.circle.center, point) <= vennCircle.circle.radius);
    }

    /*
     * @description: Get rightmost point when comparing with vectors drawn from reference point
     */
    static getRightMostPoint(point1: Point, point2: Point, reference: Point): Point {
        let vector1 = this.createVector2d(reference, point1);
        let vector2 = this.createVector2d(reference, point2);
        return vector1.crossProduct(vector2) < 0 ? point1 : point2;
    }

    /*
     * @description: Get leftmost point when comparing with vectors drawn from reference point
     */
    static getLeftMostPoint(point1: Point, point2: Point, reference: Point): Point {
        let vector1 = this.createVector2d(reference, point1);
        let vector2 = this.createVector2d(reference, point2);
        return vector1.crossProduct(vector2) >= 0 ? point1 : point2;
    }

    /*
     * @description: Get the intersectionpoint of other circles that is inside reference circle
     */
    static getIntersectionPointInsideCircle(reference: Circle, other1: Circle, other2: Circle): Point {
        let intersections = VennDiagramUtils.getIntersections(other1, other2);
        return reference.containsPoint(intersections.point1) ? intersections.point1 : intersections.point2;
    }

    /*
     * @description: Get the intersectionpoint of other circles that is outside reference circle
     */
    static getIntersectionPointOutsideCirle(reference: Circle, other1: Circle, other2: Circle): Point {
        let intersections = VennDiagramUtils.getIntersections(other1, other2);
        return reference.containsPoint(intersections.point1) ? intersections.point2 : intersections.point1;
    }


}