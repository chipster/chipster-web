import * as _ from 'lodash';
import CSVModel from "../../../../../services/csv/CSVModel";
import Line from "./line";
import Point from "./point";
import Rectangle from "./rectangle";

export default class ExpressionProfileService {

    static getFloor(first: number, second: number) {
        return first <= second ? _.floor(first) : _.floor(second);
    }

    static getCeil(first: number, second: number) {
        return first >= second ? _.ceil(first) : _.ceil(second);
    }

    static createLines(csvModel: CSVModel, chipValueIndex: number, linearXScale: any, yScale: any): Array<Line> {
        return _.map(csvModel.body, row => {

            // get indexes for finding raw data value for lines start and end points
            let chipLineStartDataIndex = csvModel.chipValueIndexes[chipValueIndex];
            let chipLineEndDataIndex = csvModel.chipValueIndexes[chipValueIndex + 1];

            // get raw data for lines start and end points
            let lineStartValue = row[chipLineStartDataIndex];
            let lineEndValue = row[chipLineEndDataIndex];

            return this.createLine(row[0], chipValueIndex, lineStartValue, lineEndValue, linearXScale, yScale);
        } );
    }

    static createLine(lineDataIndex: number, chipValueIndex: number, lineStartValue: string, lineEndValue: string, linearXScale: any, yScale: any ): Line {

        // get pixel values for lines start and end positions
        let x1 = linearXScale(chipValueIndex);
        let y1 = yScale(lineStartValue);
        let x2 = linearXScale(chipValueIndex + 1);
        let y2 = yScale(lineEndValue);

        return new Line(lineDataIndex, x1, y1, x2, y2);
    }


    /*
     * Determine if line is intersecting with a rectangle
     * https://gist.github.com/ChickenProp/3194723
     */
    static isIntersecting(line: Line, rectangle: Rectangle) {
        let u1 = Number.MIN_VALUE;
        let u2 = Number.MAX_VALUE;
        let p = [-Math.abs(line.vx), Math.abs(line.vx), -Math.abs(line.vy), Math.abs(line.vy)];
        let q = [line.start.x - rectangle.topleft.x, rectangle.bottomright.x - line.start.x, line.start.y - rectangle.topleft.y, rectangle.bottomright.y - line.start.y];

        for (let i = 0; i < 4; i++) {
            if (p[i] == 0) {
                if (q[i] < 0) {
                    return false;
                }
            } else {
                var t = q[i] / p[i];
                if (p[i] < 0 && u1 < t) {
                    u1 = t;
                } else if (p[i] > 0 && u2 > t) {
                    u2 = t;
                }

            }
        }

        if (u1 > u2 || u1 > 1 || u1 < 0) {
            return false;
        }

        return true;
    }

}