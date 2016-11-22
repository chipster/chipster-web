
import Point from "./point";
import VennDiagramUtils from "../venndiagram/venndiagramutils";
export default class Circle {

    center: Point;
    radius: number;

    constructor(center: Point, radius: number) {
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