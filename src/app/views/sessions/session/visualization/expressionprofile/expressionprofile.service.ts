import * as _ from "lodash";
import TSVFile from "../../../../../model/tsv/TSVFile";
import Line from "./line";
import Rectangle from "./rectangle";
import Point from "../model/point";
import TSVRow from "../../../../../model/tsv/TSVRow";
import { ExpressionProfileTSVService } from "./expressionprofileTSV.service";
import { Injectable } from "@angular/core";

@Injectable()
export class ExpressionProfileService {
  constructor(
    private expressionprofileTSVService: ExpressionProfileTSVService
  ) {}

  // X-axis indexes for intervals the selection rectangle is crossing
  getCrossingIntervals(p1: Point, p2: Point, linearXScale: any, tsv: TSVFile) {
    let startIndex = this.getFloor(
      linearXScale.invert(p1.x),
      linearXScale.invert(p2.x)
    );
    let endIndex = this.getCeil(
      linearXScale.invert(p1.x),
      linearXScale.invert(p2.x)
    );
    if (startIndex < 0) {
      startIndex = 0;
    }

    if (
      endIndex >=
      this.expressionprofileTSVService.getChipHeaders(tsv).length - 1
    ) {
      endIndex =
        this.expressionprofileTSVService.getChipHeaders(tsv).length - 1;
    }

    return {
      start: startIndex,
      end: endIndex
    };
  }

  getFloor(first: number, second: number) {
    return first <= second ? _.floor(first) : _.floor(second);
  }

  getCeil(first: number, second: number) {
    return first >= second ? _.ceil(first) : _.ceil(second);
  }

  createLines(
    tsv: TSVFile,
    chipIndex: number,
    linearXScale: any,
    yScale: any
  ): Array<Line> {
    return _.map(tsv.body.rows, (tsvRow: TSVRow) => {
      // get indexes for finding raw data value for lines start and end points
      const chipIndexes = this.expressionprofileTSVService.getChipHeaderIndexes(
        tsv.headers
      );
      const chipLineStartDataIndex = chipIndexes[chipIndex];
      const chipLineEndDataIndex = chipIndexes[chipIndex + 1];

      // get raw data for lines start and end points
      const lineStartValue = tsvRow.row[chipLineStartDataIndex];
      const lineEndValue = tsvRow.row[chipLineEndDataIndex];

      return this.createLine(
        tsvRow.id,
        chipIndex,
        lineStartValue,
        lineEndValue,
        linearXScale,
        yScale
      );
    });
  }

  createLine(
    lineId: string,
    chipValueIndex: number,
    lineStartValue: string,
    lineEndValue: string,
    linearXScale: any,
    yScale: any
  ): Line {
    // get pixel values for lines start and end positions
    const [x1, y1] = [linearXScale(chipValueIndex), yScale(lineStartValue)];
    const [x2, y2] = [linearXScale(chipValueIndex + 1), yScale(lineEndValue)];
    return new Line(lineId, x1, y1, x2, y2);
  }

  // Check if line intersecting with rectangle
  isIntersecting(line: Line, rectangle: Rectangle) {
    // Completely outside.
    if (
      (line.start.x <= rectangle.topleft.x &&
        line.end.x <= rectangle.topleft.x) ||
      (line.start.y <= rectangle.topleft.y &&
        line.end.y <= rectangle.topleft.y) ||
      (line.start.x >= rectangle.bottomright.x &&
        line.end.x >= rectangle.bottomright.x) ||
      (line.start.y >= rectangle.bottomright.y &&
        line.end.y >= rectangle.bottomright.y)
    ) {
      return false;
    }

    const m = (line.end.y - line.start.y) / (line.end.x - line.start.x);

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
