import * as _ from 'lodash';
import CSVModel from "./TSV";
import Line from "./line";
import Rectangle from "./rectangle";
import Point from "./point";

export default class ExpressionProfileService {

    // X-axis indexes for intervals the selection rectangle is crossing
    getCrossingIntervals(p1: Point, p2: Point, linearXScale: any, csvModel: CSVModel) {
        let startIndex = this.getFloor( linearXScale.invert(p1.x), linearXScale.invert(p2.x) );
        let endIndex  = this.getCeil( linearXScale.invert(p1.x), linearXScale.invert(p2.x) );
        if(startIndex < 0) {
            startIndex = 0;
        }

        if(endIndex >= csvModel.getChipHeaders().length - 1) {
            endIndex = csvModel.getChipHeaders().length - 1;
        }

        return {
            start: startIndex,
            end: endIndex
        }
    }

    getFloor(first: number, second: number) {
        return first <= second ? _.floor(first) : _.floor(second);
    }

    getCeil(first: number, second: number) {
        return first >= second ? _.ceil(first) : _.ceil(second);
    }

    createLines(csvModel: CSVModel, chipValueIndex: number, linearXScale: any, yScale: any): Array<Line> {
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

    createLine(lineDataIndex: number, chipValueIndex: number, lineStartValue: string, lineEndValue: string, linearXScale: any, yScale: any ): Line {

        // get pixel values for lines start and end positions
        let x1 = linearXScale(chipValueIndex);
        let y1 = yScale(lineStartValue);
        let x2 = linearXScale(chipValueIndex + 1);
        let y2 = yScale(lineEndValue);

        return new Line(lineDataIndex, x1, y1, x2, y2);
    }

    // Check if line intersecting with rectangle
    isIntersecting(line: Line, rectangle: Rectangle) {
        // Completely outside.
        if ( (line.start.x <= rectangle.topleft.x && line.end.x <= rectangle.topleft.x) ||
            (line.start.y <= rectangle.topleft.y && line.end.y <= rectangle.topleft.y) ||
            (line.start.x >= rectangle.bottomright.x && line.end.x >= rectangle.bottomright.x) ||
            (line.start.y >= rectangle.bottomright.y && line.end.y >= rectangle.bottomright.y)) {
            return false;
        }

        let m = (line.end.y - line.start.y) / (line.end.x - line.start.x);

        let y = m * (rectangle.topleft.x - line.start.x) + line.start.y;
        if (y > rectangle.topleft.y && y < rectangle.bottomright.y) return true;

        y = m * (rectangle.bottomright.x - line.start.x) + line.start.y;
        if (y > rectangle.topleft.y && y < rectangle.bottomright.y) return true;

        let x = (rectangle.topleft.y - line.start.y) / m + line.start.x;
        if (x > rectangle.topleft.x && x < rectangle.bottomright.x) return true;

        x = (rectangle.bottomright.y - line.start.y) / m + line.start.x;
        if (x > rectangle.topleft.x && x < rectangle.bottomright.x) return true;

        return false;
    }

}