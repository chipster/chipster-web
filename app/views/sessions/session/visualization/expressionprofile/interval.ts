import {Line} from "./line";
import Rectangle from "./rectangle";
export default class Interval {

    constructor(startIndex: number, lines: Array<Line>, rectangle: Rectangle) {
        this._startIndex = startIndex;
        this._endIndex = startIndex + 1;
        this._lines = lines;
        this._rectangle = rectangle;
    }

    get lines(): Array<Line> {
        return this._lines;
    }

    set lines(value: Array<Line>) {
        this._lines = value;
    }

    get rectangle(): Rectangle {
        return this._rectangle;
    }

    set rectangle(value: Rectangle) {
        this._rectangle = value;
    }

    get startIndex(): number {
        return this._startIndex;
    }

    set startIndex(value: number) {
        this._startIndex = value;
    }

    get endIndex(): number {
        return this._endIndex;
    }

    set endIndex(value: number) {
        this._endIndex = value;
    }

    private _lines: Array<Line>;
    private _rectangle: Rectangle;
    private _startIndex: number;
    private _endIndex: number;



}