import * as _ from "lodash";
import Point from "../model/point";

export default class Rectangle {
  private _topleft: Point;
  private _bottomright: Point;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    // order given xs and ys to find topleft and bottomright corners
    let xs = _.sortBy([x1, x2]);
    let ys = _.sortBy([y1, y2]);

    this._topleft = new Point(xs[0], ys[0]);
    this._bottomright = new Point(xs[1], ys[1]);
  }

  set topleft(value: Point) {
    this._topleft = value;
  }

  set bottomright(value: Point) {
    this._bottomright = value;
  }

  get topleft(): Point {
    return this._topleft;
  }

  get bottomright(): Point {
    return this._bottomright;
  }
}
