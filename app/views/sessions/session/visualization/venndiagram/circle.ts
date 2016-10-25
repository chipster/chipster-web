
import Point from "../model/point";
import VennDiagramUtils from "./venndiagramutils";
export default class Circle {

    data: Set<string>;
    center: Point;
    radius: number;

    constructor(data: Set<string>, center: Point, radius: number) {
        this.data = data;
        this.center = center;
        this.radius = radius;
    }

    equals(other: Circle): boolean {
        return (this.center.x === other.center.x) && (this.center.y === other.center.y) && (this.radius === other.radius);
    }

    containsPoint(point: Point): boolean {
        return VennDiagramUtils.distance(this.center, point) <= this.radius;
    }

}