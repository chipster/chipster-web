import Point from "../model/point";

export default class Line {

    private _lineId: string;
    private _start: Point;
    private _end: Point;
    private _vx: number;
    private _vy: number;

    constructor(lineId: string, x1: number, y1: number, x2: number, y2: number) {
        this._lineId = lineId;
        this._start = new Point(x1, y1);
        this._end = new Point(x2, y2);
        this._vx = this._end.x - this._start.x;
        this._vy = this._end.y - this._start.y;
    }

    get lineId(): string {
        return this._lineId;
    }

    get start(): Point {
        return this._start;
    }

    set start(value: Point) {
        this._start = value;
    }

    set end(value: Point) {
        this._end = value;
    }

    get end(): Point {
        return this._end;
    }

    get vx(): number {
        return this._vx;
    }

    set vx(value: number) {
        this._vx = value;
    }

    get vy(): number {
        return this._vy;
    }

    set vy(value: number) {
        this._vy = value;
    }
}