import { Injectable } from "@angular/core";
import { combineAll } from "rxjs/operators";

@Injectable()
export class SpreadsheetService {
  constructor() {}

  /**
   * Calculate the approximate widht of the table
   *
   * We need the whole right side of the main view to scroll to fit in all the components.
   * The table's internal vertical scrolling has to be disabled, because nested scrolling elements
   * would be difficult to use. But when we let the table to grow vertically, it's horizontal scroll bar
   * will go out of the screen. Consequently we have to disable the internal vertical scrolling too.
   * As far as I know, setting the table width is the only way to do it at the moment.
   *
   * The calculation is based on many guesses (margins, font size, font itself) but as long as the result is
   * greater than the actual table width, the error will only create a larger margin.
   *
   * @param {string[]} headers
   * @param {string[][]} content
   * @returns {number}
   */
  guessWidth(headers: string[], content: string[][]) {
    // create a new first row from headers
    const table = content.slice();
    if (headers != null) {
      table.unshift(headers);
    }
    const tableMargin = 20;
    const colMargins = 10;
    let colWidthSum = 0;
    const columnCount = table[0].length;

    const ctx = this.getTextMeasuringContext(18);

    // iterate columns
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      const colWidth = table

        // text from this column on each row
        .map((row) => row[colIndex])

        // width of the text
        .map((cell) => ctx.measureText(cell).width)

        // max width in this column
        .reduce((a, b) => Math.max(a, b));

      colWidthSum += colWidth;
    }

    return colWidthSum + columnCount * colMargins + tableMargin;
  }

  getTextMeasuringContext(fontSize = 18) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = fontSize + "px Arial";
    return ctx;
  }
}
