
import {Injectable} from "@angular/core";
import Point from "../model/point";
import Circle from "../model/circle";
import TwoCircleVennDiagramService from "./twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./threecirclevenndiagram.service";
import VennCircle from "./venncircle";
import TSVFile from "../../../../../model/tsv/TSVFile";
import VennDiagramSelection from "./venndiagramselection";

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
    getDataIntersection(circles: Array<VennCircle>): Array<string> {
        let values = _.map(circles, (vennCircle: VennCircle) => vennCircle.data);
        return _.intersection(...values);
    }

    /*
     * @description: Create
     */
    generateNewDatasetTSV(files: Array<TSVFile>, selection: VennDiagramSelection, columnKey: string): Array<Array<string>> {
        let headers = files.map( (file: TSVFile) => file.headers);


        let tsv = _.map(selection.datasetIds, (datasetId: string) => {
            let file = _.find(files, (file: TSVFile) => file.datasetId === datasetId);
            let keys = selection.values;

        });
    }

}