import * as _ from "lodash";
import GeneExpression from "../geneexpression";

export default class TSVRow {

    id: string;
    row: Array<string>;

    constructor(row: Array<string>, id: string) {
        this.id = id;
        this.row = row;
    }

    size(): number {
        return this.row.length;
    }

    /*
     * Return new array from row containing items in indexes of parameter
     */
    getCellsByIndexes(indexes: Array<number>): Array<string> {
        return _.map(indexes, (index: number) => this.row[index]);
    }

    /*
     * Get original TSVRow data
     */
    getRawData(): Array<string> {
        return _.drop(this.row, 1);
    }

}