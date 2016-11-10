
import Circle from "../model/circle";
import * as _ from 'lodash';
import Point from "../model/point";
export default class VennCircle {

    data: Array<string>;
    circle: Circle;

    constructor(public datasetId: string, public filename: string, data: Array<string>, center: Point, radius: number) {
        datasetId;
        filename;
        this.data = _.uniq(data);
        this.circle = new Circle(center, radius);
    }

}