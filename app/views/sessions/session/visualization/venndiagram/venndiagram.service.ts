
import {Injectable} from "@angular/core";
import TSVColumn from "../../../../../model/tsv/TSVColumn";
import Point from "../model/point";
import Circle from "./circle";
import TwoCircleVennDiagramService from "./twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./threecirclevenndiagram.service";

@Injectable()
export default class VennDiagramService {

    constructor(private twoCircleVenndiagramService: TwoCircleVennDiagramService, private threeCircleVenndiagramService: ThreeCircleVennDiagramService){}

    /*
     * @description get unique values from two columns and return them as a set
     */
    getInterSection(col1: TSVColumn, col2: TSVColumn): Set {
        let set = new Set();
        for(let item of col1.data) { set.add(item) }
        for(let item of col2.data) { set.add(item) }
        return set;
    }

    /*
     * @description: Create venn-diagram circles with given data, visualization area centerpoint and circle radius
     */
    createCircles(ellipseDatas: Array<Set<string>>, visualizationAreaCenter: Point, radius: number): Array<Circle> {
        let ellipseCenterPoints = ellipseDatas.length === 2 ? this.twoCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius) : this.threeCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius);
        return _.map(ellipseDatas, (ellipseData: Set<string>, index: number) => new Circle(ellipseData, ellipseCenterPoints[index], radius));
    }

    getSelectionDescriptor(circles: Array<Circle>, selectionCircles: Array<Circle>, radius: number, visualizationCenter: Point): string {
        return circles.length === 2 ? this.twoCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius, visualizationCenter) : this.threeCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius, visualizationCenter);
    }

}