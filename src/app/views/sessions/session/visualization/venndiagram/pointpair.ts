
import Point from "../model/point";
import VennDiagramUtils from "./venndiagramutils";

export default class PointPair {

    point1: Point;
    point2: Point;

    constructor(point1: Point, point2: Point) {
        this.point1 = point1;
        this.point2 = point2;
    }

    /*
     * @description: get the point of this pointpair which is closer to the point given as parameter
     */
    closerPoint(other: Point): Point {
        let distance1 = VennDiagramUtils.distance(other, this.point1);
        let distance2 = VennDiagramUtils.distance(other, this.point2);
        return distance1 <= distance2 ? this.point1 : this.point2;
    }

    /*
     * @description: get the point of this pointpair which is further away from the point given as parameter
     */
    moreDistantPoint(other: Point): Point {
        let distance1 = VennDiagramUtils.distance(other, this.point1);
        let distance2 = VennDiagramUtils.distance(other, this.point2);
        return distance1 > distance2 ? this.point1 : this.point2;
    }

    /*
     * @description: get the point that is upper in the svg coordinate system (smaller y-value is upper)
     */
    getUpperPoint(): Point {
        return this.point1.y <= this.point2.y ? this.point1 : this.point2;
    }

    /*
     * @description: get the point that is lower in the svg coordinate system (larger y-value is lower)
     */
    getLowerPoint(): Point {
        return this.point1.y > this.point2.y ? this.point1 : this.point2;
    }

}