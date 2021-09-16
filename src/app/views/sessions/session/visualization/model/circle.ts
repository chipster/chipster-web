import Point from "./point";
export default class Circle {
  center: Point;
  radius: number;

  constructor(center: Point, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  equals(other: Circle): boolean {
    return this.center.x === other.center.x && this.center.y === other.center.y && this.radius === other.radius;
  }

  containsPoint(point: Point): boolean {
    return Point.distance(this.center, point) <= this.radius;
  }
}
