import { Injectable } from "@angular/core";
import { tail, every, includes, sortBy, differenceBy, head, forEach } from "lodash-es";
import TSVFile from "../../../../../model/tsv/TSVFile";
import TSVHeaders from "../../../../../model/tsv/TSVHeaders";
import TSVRow from "../../../../../model/tsv/TSVRow";
import Circle from "../model/circle";
import Point from "../model/point";
import { ThreeCircleVennDiagramService } from "./three-circle-venn-diagram.service";
import { TwoCircleVennDiagramService } from "./two-circle-venn-diagram.service";
import VennCircle from "./venn-circle";
import VennDiagramSelection from "./venn-diagram-selection";
import VennDiagramText from "./venn-diagram-text";

@Injectable()
export class VennDiagramService {
  constructor(
    private twoCircleVenndiagramService: TwoCircleVennDiagramService,
    private threeCircleVenndiagramService: ThreeCircleVennDiagramService,
  ) {}

  getCircleCenterPoints(fileCount: number, visualizationAreaCenter: Point, radius: number): Array<Point> {
    return fileCount === 2
      ? this.twoCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius)
      : this.threeCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius);
  }

  getSelectionDescriptor(
    circles: Array<Circle>,
    selectionCircles: Array<Circle>,
    radius: number,
    visualizationCenter: Point,
  ): string {
    return circles.length === 2
      ? this.twoCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius)
      : this.threeCircleVenndiagramService.getSelectionDescriptor(
          circles,
          selectionCircles,
          radius,
          visualizationCenter,
        );
  }

  /*
   * @description: get intersection data of given circles
   */
  getDataIntersection(
    selectionCircles: Array<VennCircle>,
    allCircles: Array<VennCircle>,
    columnKey: string,
  ): Array<Array<string>> {
    const differenceCircles = allCircles.filter((circle: VennCircle) => !includes(selectionCircles, circle));
    return this.getSelectionData(selectionCircles, differenceCircles, columnKey);
  }

  /*
   * @description: return the intersection of selectionCircles data minus the datas of difference circles
   */
  getSelectionData(
    selectionCircles: Array<VennCircle>,
    difference: Array<VennCircle>,
    columnKey: string,
  ): Array<Array<string>> {
    const compareByIndex = columnKey === "symbol" ? 0 : 1;

    // all values from selected circles
    const values = selectionCircles.map((vennCircle: VennCircle) => vennCircle.data);

    // intersecting values from selected circles
    const intersection = this.intersectionBySubarrayIndex(values, compareByIndex);

    // all values from difference circles (circles that aren't selected)
    const differenceValues = difference.map((vennCircle: VennCircle) => vennCircle.data);

    // intersecting values from selected circles minus values in difference circles
    return differenceBy(intersection, ...differenceValues, compareByIndex as any);
  }

  /*
   * @description: return the subarrays (arrays with two values) that are
   * found in each array since wanted values should reside in each array
   * we can compare only values in the first array to all the rest arrays
   * and see if a value is found in each of them.
   */
  intersectionBySubarrayIndex(values: Array<Array<Array<string>>>, compareByIndex: number): Array<Array<string>> {
    const result = [];

    const arraysToCompare = tail(values).map((array: Array<Array<string>>) =>
      array.map((row: Array<string>) => row[compareByIndex]),
    );

    forEach(head(values), (pair: Array<string>) => {
      const comparator = pair[compareByIndex];
      if (every(arraysToCompare, (array: Array<string>) => includes(array, comparator))) {
        result.push(pair);
      }
    });
    return result;
  }

  /*
   * @description: Create new TSVFile based on selected values
   */
  generateNewDatasetTSV(
    files: Array<TSVFile>,
    selection: VennDiagramSelection,
    keyColumn: string,
  ): Array<Array<string>> {
    // the order here is different from normal tsv files
    // this is the order identifier and symbol are shown in the venn diagram side panel
    const selectionKeyColumnIndex = keyColumn === "symbol" ? 0 : 1;

    // get tsvFiles for the selected files
    const tsvFiles = files.filter((tsvFile: TSVFile) => selection.datasetIds.includes(tsvFile.datasetId));

    // put all rows from tsvFiles to maps, use columnKey as the key
    const tsvMaps = tsvFiles.map((tsvFile: TSVFile) => this.tsvFileToMap(tsvFile, keyColumn));

    // get headers of the tsvFiles
    const tsvHeaders = tsvFiles.map((tsvFile: TSVFile) => tsvFile.headers);

    // go through selection, pick rows from all selected files
    const newRowsAsMaps = selection.values.map((selectionRow: Array<string>) => {
      const keyValue = selectionRow[selectionKeyColumnIndex];
      const newRowMap = new Map<string, string>();
      tsvMaps.forEach((tsvMap, i) => {
        const row = tsvMap.get(keyValue);
        tsvHeaders[i].headers.forEach((header, j) => {
          // TODO for now use the selection order of the inputs
          if (!newRowMap.has(header)) {
            newRowMap.set(header, row[j]);
          }
          // else if (newRowMap.get(header) !== row[j]) {
          //   const message = this.getUnequalErrorMessage(
          //     tsvFiles,
          //     tsvMaps,
          //     tsvHeaders,
          //     keyValue,
          //     header
          //   );
          //   throw new Error(message);
          // }
        });
      });
      return newRowMap;
    });

    const uniqueHeadersArray = this.getUniqueHeaders(tsvHeaders);

    // turn maps to rows
    const body = newRowsAsMaps.map((rowMap) => uniqueHeadersArray.map((header) => rowMap.get(header)));

    return [uniqueHeadersArray, ...body];
  }

  /*
   * @description: Create new TSVFile based on selected values
   */
  /*
   * @description: map given tsv bodyrows items to new indexes in
   */
  /*
   * @description: map given tsv bodyrows items to new indexes in
   */
  rearrangeCells(tsvRows: Array<TSVRow>, sortingMap: Map<number, number>): Array<Array<string>> {
    return tsvRows.map((tsvRow: TSVRow) => {
      const sortedRow = [];

      sortingMap.forEach((key: number, index: number) => {
        sortedRow[index] = tsvRow.getCellByIndex(key);
      });

      return sortedRow;
    });
  }

  /*
   * @description: Find out rows which contain a value from values-array in the given column
   */
  getTSVRowsContainingValues(file: TSVFile, values: Array<string>, columnIndex: number): Array<TSVRow> {
    return file.body.rows.filter((row: TSVRow) => includes(values, row.getCellByIndex(columnIndex)));
  }

  /*
   * @description: Get column indexes for given header-keys in file
   */
  getSortedIndexMapping(file: TSVFile, headers: Array<string>): Map<number, number> {
    const mapping = new Map();
    headers.forEach((header: string, index: number) => {
      mapping.set(index, file.getColumnIndex(header));
    });
    return mapping;
  }

  /*
   * @description: find out position for text containing circles filename and its item count
   */
  getVennCircleFilenamePoint(vennCircle: VennCircle, visualizationAreaCenter: Point): Point {
    if (vennCircle.circle.center.x === visualizationAreaCenter.x) {
      return new Point(
        visualizationAreaCenter.x - vennCircle.circle.radius * 0.5,
        vennCircle.circle.center.y - vennCircle.circle.radius - 3,
      );
    }
    if (vennCircle.circle.center.x < visualizationAreaCenter.x) {
      return new Point(
        vennCircle.circle.center.x - vennCircle.circle.radius * 1.2,
        vennCircle.circle.center.y + vennCircle.circle.radius + 5,
      );
    }
    return new Point(
      vennCircle.circle.center.x + vennCircle.circle.radius * 0.8,
      vennCircle.circle.center.y + vennCircle.circle.radius + 5,
    );
  }

  /*
   * @description: get count of items and positions for texts in each segment
   */
  getVennDiagramSegmentTexts(
    vennCircles: Array<VennCircle>,
    visualizationAreaCenter: Point,
    columnKey: string,
  ): Array<VennDiagramText> {
    return vennCircles.length === 2
      ? this.getTwoVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey)
      : this.getThreeVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey);
  }

  /*
   * @description: get position for venn diagrams segment where the count of it's items is displayed
   */
  getTwoVennDiagramSegmentTexts(
    circles: Array<VennCircle>,
    visualizationAreaCenter: Point,
    columnKey: string,
  ): Array<VennDiagramText> {
    const result = [];

    const leftCircle = circles[0].circle.center.x < visualizationAreaCenter.x ? circles[0] : circles[1];
    const rightCircle = circles[0].circle.center.x > visualizationAreaCenter.x ? circles[0] : circles[1];

    // intersection
    const intersectionCount = this.getSelectionData(circles, [], columnKey).length.toString();
    result.push(new VennDiagramText(intersectionCount, visualizationAreaCenter));

    // left circle
    const leftCircleCount = this.getSelectionData([leftCircle], [rightCircle], columnKey).length.toString();
    const leftCirclePosition = new Point(
      leftCircle.circle.center.x - leftCircle.circle.radius * 0.5,
      leftCircle.circle.center.y,
    );
    result.push(new VennDiagramText(leftCircleCount, leftCirclePosition));

    // right circle
    const rightCircleCount = this.getSelectionData([rightCircle], [leftCircle], columnKey).length.toString();
    const rightCirclePosition = new Point(
      rightCircle.circle.center.x + rightCircle.circle.radius * 0.5,
      rightCircle.circle.center.y,
    );
    result.push(new VennDiagramText(rightCircleCount, rightCirclePosition));

    return result;
  }

  /*
   * @description: get position for venn diagrams segment where the count of it's items is displayed
   */
  getThreeVennDiagramSegmentTexts(
    circles: Array<VennCircle>,
    visualizationAreaCenter: Point,
    columnKey: string,
  ): Array<VennDiagramText> {
    const result = [];
    const radius = circles[0].circle.radius;

    const circlesSortedByXAxis = sortBy(circles, (circle: VennCircle) => circle.circle.center.x);

    // circles sorted by x-axis value
    const bottomLeftCircle = circlesSortedByXAxis[0];
    const topCircle = circlesSortedByXAxis[1];
    const bottomRightCircle = circlesSortedByXAxis[2];

    const intersectionAllCirclesCount = this.getSelectionData(circles, [], columnKey).length.toString();
    result.push(new VennDiagramText(intersectionAllCirclesCount, visualizationAreaCenter));

    const intersectionBottomLeftTopCirclesCount = this.getSelectionData(
      [bottomLeftCircle, topCircle],
      [bottomRightCircle],
      columnKey,
    ).length.toString();
    const intersectionBottomLeftTopCirclesPosition = new Point(
      visualizationAreaCenter.x - radius * 0.6,
      visualizationAreaCenter.y - radius * 0.2,
    );
    result.push(new VennDiagramText(intersectionBottomLeftTopCirclesCount, intersectionBottomLeftTopCirclesPosition));

    const intersectionBottomRightTopCirclesCount = this.getSelectionData(
      [topCircle, bottomRightCircle],
      [bottomLeftCircle],
      columnKey,
    ).length.toString();
    const intersectionBottomRightTopCirclesPosition = new Point(
      visualizationAreaCenter.x + radius * 0.6,
      visualizationAreaCenter.y - radius * 0.2,
    );
    result.push(new VennDiagramText(intersectionBottomRightTopCirclesCount, intersectionBottomRightTopCirclesPosition));

    const intersectionBottomRightBottomLeftCirclesCount = this.getSelectionData(
      [bottomLeftCircle, bottomRightCircle],
      [topCircle],
      columnKey,
    ).length.toString();
    const intersectionBottomRightBottomLeftCirclesPosition = new Point(
      visualizationAreaCenter.x,
      visualizationAreaCenter.y + radius,
    );
    result.push(
      new VennDiagramText(
        intersectionBottomRightBottomLeftCirclesCount,
        intersectionBottomRightBottomLeftCirclesPosition,
      ),
    );

    const bottomLeftCircleCount = this.getSelectionData(
      [bottomLeftCircle],
      [topCircle, bottomRightCircle],
      columnKey,
    ).length.toString();
    const bottomLeftCirclePosition = new Point(
      bottomLeftCircle.circle.center.x - radius * 0.5,
      bottomLeftCircle.circle.center.y,
    );
    result.push(new VennDiagramText(bottomLeftCircleCount, bottomLeftCirclePosition));

    const topCircleCount = this.getSelectionData(
      [topCircle],
      [bottomLeftCircle, bottomRightCircle],
      columnKey,
    ).length.toString();
    const topCirclePosition = new Point(topCircle.circle.center.x, topCircle.circle.center.y - radius * 0.3);
    result.push(new VennDiagramText(topCircleCount, topCirclePosition));

    const bottomRightCircleCount = this.getSelectionData(
      [bottomRightCircle],
      [topCircle, bottomLeftCircle],
      columnKey,
    ).length.toString();
    const bottomRightCirclePosition = new Point(
      bottomRightCircle.circle.center.x + radius * 0.3,
      bottomRightCircle.circle.center.y,
    );
    result.push(new VennDiagramText(bottomRightCircleCount, bottomRightCirclePosition));

    return result;
  }

  private getUniqueHeaders(tsvHeaders: Array<TSVHeaders>): Array<string> {
    return Array.from(
      tsvHeaders
        .map((tsvHeader) => tsvHeader.headers)
        .reduce((uniqueHeadersSet: Set<string>, headersArray: Array<string>) => {
          headersArray.forEach((header: string) => {
            uniqueHeadersSet.add(header);
          });
          return uniqueHeadersSet;
        }, new Set<string>()),
    );
  }

  private tsvFileToMap(tsvFile: TSVFile, keyColumn): Map<string, Array<string>> {
    const keyColumnIndex = tsvFile.headers.getColumnIndexByKey(keyColumn);
    return new Map(
      tsvFile.body.getRawDataRows().map((row: Array<string>) => [row[keyColumnIndex], row] as [string, Array<string>]),
    );
  }

  private getUnequalErrorMessage(
    tsvFiles: Array<TSVFile>,
    tsvMaps: Array<Map<string, Array<string>>>,
    tsvHeaders: Array<TSVHeaders>,
    key: string,
    header: string,
  ): string {
    const filesAndValues = tsvFiles
      .map((tsvFile, i) => {
        const columnIndex = tsvHeaders[i].getColumnIndexByKey(header);
        if (columnIndex !== -1) {
          return [tsvFile.filename, tsvMaps[i].get(key)[columnIndex]];
        }
        return null;
      })
      .filter((fileAndValue) => fileAndValue != null)
      .reduce(
        (s: string, fileAndValue: Array<string>) => s + "<li>" + fileAndValue[0] + ": " + fileAndValue[1] + "</li>",
        "",
      );

    const message =
      `<p>Unequal value for row <i>${key}</i>, column <i>${header}</i>.</p>` +
      `<p><ul>${filesAndValues}</ul></p>` +
      `<p>This happens if two or more inputs have a common column header and the value in that column is the same.</p>
      <p>For example, the files could have a <i>pValue</i> column and for a row <i>DPEP1</i> this
      column could have different values <i>0.0001</i> and <i>0.0002</i>. In this case it's unclear
      what would be the correct value for this cell in the file to be created.</p><p>For now,
      <i>Create file</i> fails in this situation. In the future it may be possible to choose how to
       proceed in a situation like this.</p>`;

    return message;
  }
}
