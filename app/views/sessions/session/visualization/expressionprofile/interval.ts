
import {Line} from "./line";
import Rectangle from "./rectangle";
export default class Interval {

    private lines: Array<Line>;
    private rectangle: Rectangle;
    private startIndex: number;
    private endIndex: number;

    constructor(startIndex: number, lines: Array<Line>, rectangle: Rectangle) {
        this.startIndex = startIndex;
        this.endIndex = startIndex + 1;
        this.lines = lines;
        this.rectangle = rectangle;
    }

}