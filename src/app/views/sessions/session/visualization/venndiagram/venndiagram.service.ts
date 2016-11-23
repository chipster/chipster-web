
import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "../model/circle";
import TwoCircleVennDiagramService from "./twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./threecirclevenndiagram.service";
import VennCircle from "./venncircle";
import TSVFile from "../../../../../model/tsv/TSVFile";
import VennDiagramSelection from "./venndiagramselection";
import TSVRow from "../../../../../model/tsv/TSVRow";
import VennDiagramText from "./venndiagramtext";
import * as _ from "lodash";

@Injectable()
export default class VennDiagramService {

    constructor(private twoCircleVenndiagramService: TwoCircleVennDiagramService, private threeCircleVenndiagramService: ThreeCircleVennDiagramService){}

    getCircleCenterPoints(fileCount: number, visualizationAreaCenter: Point, radius: number) : Array<Point> {
        return fileCount === 2 ? this.twoCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius) : this.threeCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius);
    }

    getSelectionDescriptor(circles: Array<Circle>, selectionCircles: Array<Circle>, radius: number, visualizationCenter: Point): string {
        return circles.length === 2 ? this.twoCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius) : this.threeCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius, visualizationCenter);
    }

    /*
     * @description: get intersection data of given circles
     */
    getDataIntersection(selectionCircles: Array<VennCircle>, allCircles: Array<VennCircle>, columnKey: string): Array<Array<string>> {
        const differenceCircles = allCircles.filter( (circle: VennCircle) => !_.includes(selectionCircles, circle));
        return this.getSelectionData(selectionCircles, differenceCircles, columnKey);
    }



    /*
     * @description: return the intersection of selectionCircles data minus the datas of difference circles
     */
    getSelectionData(selectionCircles: Array<VennCircle>, difference: Array<VennCircle>, columnKey: string): Array<Array<string>> {
        const compareByIndex = columnKey === 'symbol' ? 0 : 1;

        // all values from selected circles
        const values = selectionCircles.map( (vennCircle: VennCircle) => vennCircle.data );

        // intersecting values from selected circles
        const intersection = _.intersectionBy(...values, compareByIndex);

        // all values from difference circles (circles that aren't selected)
        const differenceValues = difference.map( (vennCircle: VennCircle) => vennCircle.data );

        // intersecting values from selected circles minus values in difference circles
        return _.differenceBy(intersection, ...differenceValues, compareByIndex);
    }



    /*
     * @description: Create new TSVFile based on selected values
     */
    generateNewDatasetTSV(files: Array<TSVFile>, selection: VennDiagramSelection, columnKey: string): Array<Array<string>> {
        const columnKeyIndex = columnKey === 'symbol' ? 0 : 1;

        // all headers from given files
        const headers = _.chain(files)
            .map( (file: TSVFile) => file.headers.headers)
            .flatten()
            .uniq()
            .value() as Array<string>;

        let body = [];
        _.forEach(selection.datasetIds, (datasetId: string) => {
            const file = _.find(files, (file: TSVFile) => file.datasetId === datasetId);
            const values = _.flatMap(selection.values, (valueTuple: [string | undefined, string | undefined]) => valueTuple[columnKeyIndex]);
            const keyColumnIndex = file.getColumnIndex(columnKey); // index where the values are collected
            _.forEach(files, (file: TSVFile) => {
                let rows = this.getTSVRowsContainingValues(file, values, keyColumnIndex);
                let sortedIndexMapping = this.getSortedIndexMapping(file, headers);
                let sortedRows = this.rearrangeCells(rows, sortedIndexMapping);
                body = body.concat(sortedRows);
            });

        });
        return [headers, ...body];
    }

    /*
     * @description: map given tsv bodyrows items to new indexes in
     */
    rearrangeCells(tsvRows: Array<TSVRow>, sortingMap: Map<number, number>): Array<Array<string>> {
        return tsvRows.map( (tsvRow: TSVRow) => {
            let sortedRow = [];

            sortingMap.forEach( (key: number, index: number) => {
                sortedRow[index] = tsvRow.getCellByIndex(key);
            });

            return sortedRow;
        });
    }

    /*
     * @description: Find out rows which contain a value from values-array in the given column
     */
    getTSVRowsContainingValues(file: TSVFile, values: Array<string>, columnIndex: number): Array<TSVRow> {
        return _.chain(file.body.rows)
            .filter( (row: TSVRow) => _.includes(values, row.getCellByIndex(columnIndex)) )
            .value();
    }

    /*
     * @description: Get column indexes for given header-keys in file
     */
    getSortedIndexMapping(file: TSVFile, headers: Array<string>): Map<number, number> {
        let mapping = new Map();
        headers.forEach( (header:string, index:number) => { mapping.set(index, file.getColumnIndex(header)) });
        return mapping;
    }

    /*
     * @description: find out position for text containing circles filename and its item count
     */
    getVennCircleFilenamePoint(vennCircle: VennCircle, visualizationAreaCenter: Point): Point {
        if(vennCircle.circle.center.x === visualizationAreaCenter.x) {
            return new Point(visualizationAreaCenter.x - vennCircle.circle.radius * 0.5, vennCircle.circle.center.y - vennCircle.circle.radius - 3);
        } else if(vennCircle.circle.center.x < visualizationAreaCenter.x) {
            return new Point(vennCircle.circle.center.x - vennCircle.circle.radius * 1.2, vennCircle.circle.center.y + vennCircle.circle.radius + 5);
        } else {
            return new Point(vennCircle.circle.center.x + vennCircle.circle.radius * 0.8, vennCircle.circle.center.y + vennCircle.circle.radius + 5);
        }
    }

    /*
     * @description: get count of items and positions for texts in each segment
     */
    getVennDiagramSegmentTexts(vennCircles: Array<VennCircle>, visualizationAreaCenter: Point, columnKey: string): Array<VennDiagramText> {
        return vennCircles.length === 2 ? this.getTwoVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey) : this.getThreeVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey);
    }

    /*
     * @description: get position for venn diagrams segment where the count of it's items is displayed
     */
    getTwoVennDiagramSegmentTexts(circles: Array<VennCircle>, visualizationAreaCenter: Point, columnKey: string): Array<VennDiagramText> {
        let result = [];

        const leftCircle = (circles[0].circle.center.x < visualizationAreaCenter.x) ? circles[0] : circles[1];
        const rightCircle = (circles[0].circle.center.x > visualizationAreaCenter.x) ? circles[0] : circles[1];

        //intersection
        const intersectionCount = this.getSelectionData(circles, [], columnKey).length.toString();
        result.push(new VennDiagramText(intersectionCount, visualizationAreaCenter));

        // left circle
        const leftCircleCount = this.getSelectionData([leftCircle], [rightCircle], columnKey).length.toString();
        const leftCirclePosition = new Point(leftCircle.circle.center.x - leftCircle.circle.radius * 0.5, leftCircle.circle.center.y);
        result.push(new VennDiagramText(leftCircleCount, leftCirclePosition));

        // right circle
        const rightCircleCount = this.getSelectionData([rightCircle], [leftCircle], columnKey).length.toString();
        const rightCirclePosition = new Point(rightCircle.circle.center.x + rightCircle.circle.radius * 0.5, rightCircle.circle.center.y);
        result.push(new VennDiagramText(rightCircleCount, rightCirclePosition));

        return result;
    }

    /*
     * @description: get position for venn diagrams segment where the count of it's items is displayed
     */
    getThreeVennDiagramSegmentTexts(circles: Array<VennCircle>, visualizationAreaCenter: Point, columnKey: string): Array<VennDiagramText> {
        let result = [];
        const radius = circles[0].circle.radius;

        let circlesSortedByXAxis = _.sortBy(circles, (circle: VennCircle) => circle.circle.center.x);

        // circles sorted by x-axis value
        const bottomLeftCircle = circlesSortedByXAxis[0];
        const topCircle = circlesSortedByXAxis[1];
        const bottomRightCircle = circlesSortedByXAxis[2];

        const intersectionAllCirclesCount = this.getSelectionData(circles, [], columnKey).length.toString();
        result.push(new VennDiagramText(intersectionAllCirclesCount, visualizationAreaCenter));

        const intersectionBottomLeftTopCirclesCount = this.getSelectionData([bottomLeftCircle, topCircle], [bottomRightCircle], columnKey).length.toString();
        const intersectionBottomLeftTopCirclesPosition = new Point(visualizationAreaCenter.x - radius * 0.6, visualizationAreaCenter.y - radius * 0.2);
        result.push(new VennDiagramText(intersectionBottomLeftTopCirclesCount, intersectionBottomLeftTopCirclesPosition));

        const intersectionBottomRightTopCirclesCount = this.getSelectionData([topCircle, bottomRightCircle], [bottomLeftCircle], columnKey).length.toString();
        const intersectionBottomRightTopCirclesPosition = new Point(visualizationAreaCenter.x + radius * 0.6, visualizationAreaCenter.y - radius * 0.2);
        result.push(new VennDiagramText(intersectionBottomRightTopCirclesCount, intersectionBottomRightTopCirclesPosition));

        const intersectionBottomRightBottomLeftCirclesCount = this.getSelectionData([bottomLeftCircle, bottomRightCircle], [topCircle], columnKey).length.toString();
        const intersectionBottomRightBottomLeftCirclesPosition = new Point(visualizationAreaCenter.x , visualizationAreaCenter.y + radius);
        result.push(new VennDiagramText(intersectionBottomRightBottomLeftCirclesCount, intersectionBottomRightBottomLeftCirclesPosition));

        const bottomLeftCircleCount = this.getSelectionData([bottomLeftCircle], [topCircle, bottomRightCircle], columnKey).length.toString();
        const bottomLeftCirclePosition = new Point(bottomLeftCircle.circle.center.x - radius * 0.5, bottomLeftCircle.circle.center.y);
        result.push(new VennDiagramText(bottomLeftCircleCount, bottomLeftCirclePosition));

        const topCircleCount = this.getSelectionData([topCircle], [bottomLeftCircle, bottomRightCircle], columnKey).length.toString();
        const topCirclePosition = new Point(topCircle.circle.center.x, topCircle.circle.center.y - radius * 0.3);
        result.push(new VennDiagramText(topCircleCount, topCirclePosition));

        const bottomRightCircleCount = this.getSelectionData([bottomRightCircle], [topCircle, bottomLeftCircle], columnKey).length.toString();
        const bottomRightCirclePosition = new Point(bottomRightCircle.circle.center.x + radius * 0.3, bottomRightCircle.circle.center.y);
        result.push(new VennDiagramText(bottomRightCircleCount, bottomRightCirclePosition));

        return result;
    }
}
