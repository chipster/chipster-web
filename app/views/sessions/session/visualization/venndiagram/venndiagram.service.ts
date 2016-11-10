
import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "../model/circle";
import TwoCircleVennDiagramService from "./twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./threecirclevenndiagram.service";
import VennCircle from "./venncircle";
import TSVFile from "../../../../../model/tsv/TSVFile";
import VennDiagramSelection from "./venndiagramselection";
import TSVRow from "../../../../../model/tsv/TSVRow";
import Vector2d from "../model/vector2d";
import VennDiagramText from "./venndiagramtext";

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
    getDataIntersection(selectionCircles: Array<VennCircle>, allCircles: Array<VennCircle>): Array<string> {
        const differenceCircles = allCircles.filter( (circle: VennCircle) => !_.includes(selectionCircles, circle));
        return this.getSelectionData(selectionCircles, differenceCircles);
    }

    /*
     * @description: return the intersection of selectionCircles data minus the datas of dirrerence circles
     */
    getSelectionData(selectionCircles: Array<VennCircle>, difference: Array<VennCircle>): Array<string> {
        const values = _.map(selectionCircles, (vennCircle: VennCircle) => vennCircle.data);
        const intersection = _.intersection(...values);
        const differenceValues = difference.map( (circle: VennCircle) => circle.data);
        return _.difference(intersection, ...differenceValues);
    }

    /*
     * @description: Create new TSVFile based on selected values
     */
    generateNewDatasetTSV(files: Array<TSVFile>, selection: VennDiagramSelection, columnKey: string): Array<Array<string>> {

        // all headers from given files
        const headers = _.chain(files)
            .map( (file: TSVFile) => file.headers.headers)
            .flatten()
            .uniq()
            .value();

        let body = [];
        _.forEach(selection.datasetIds, (datasetId: string) => {
            const file = _.find(files, (file: TSVFile) => file.datasetId === datasetId);
            const values = selection.values;
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
    rearrangeCells(tsvRows: Array<TSVRow>, sortingMap: Map): Array<Array<string>> {
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

    getVennDiagramSegmentTexts(vennCircles: Array<VennCircle>, visualizationAreaCenter: Point): Array<VennDiagramText> {
        return vennCircles.length === 2 ? this.getTwoVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter) : this.getThreeVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter);
    }

    /*
     * @description: get position for venn diagrams segment where the count of it's items is displayed
     */
    getTwoVennDiagramSegmentTexts(circles: Array<VennCircle>, visualizationAreaCenter: Point): Array<VennDiagramText> {
        let result = [];
        const circle1 = circles[0];
        const circle2 = circles[1];

        //intersection
        let intersectionData = this.getDataIntersection([circle1, circle2], circles);
        result.push(new VennDiagramText(intersectionData.length.toString(), visualizationAreaCenter));

        // left circle
        let circle1Data = this.getDataIntersection([circle1], [circle2]);
        result.push(new VennDiagramText(circle1Data.length.toString(), new Point(circle1.circle.center.x - circle1.circle.radius * 0.5, circle1.circle.center.y)));

        // right circle
        let circle2Data = this.getDataIntersection([circle2], [circle1]);
        result.push(new VennDiagramText(circle2Data.length.toString(), new Point(circle2.circle.center.x + circle2.circle.radius * 0.5, circle2.circle.center.y)));

        return result;
    }

    getThreeVennDiagramSegmentTexts(circles: Array<VennCircle>, visualizationAreaCenter: Point): Array<VennDiagramText> {
        return [];
    }
}