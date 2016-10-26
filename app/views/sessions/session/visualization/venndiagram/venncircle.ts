
import Circle from "../model/circle";
import * as _ from 'lodash';
import Point from "../model/point";
export default class VennCircle {

    data: Array<string>;
    circle: Circle;
    datasetId: string;

    constructor(datasetId: string, data: Array<string>, center: Point, radius: number) {
        this.datasetId = datasetId;
        this.data = _.uniq(data);
        this.circle = new Circle(center, radius);
    }

}