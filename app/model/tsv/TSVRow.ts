import * as _ from "lodash";

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
     * Return new array from row containing items in indexes array
     */
    getCellsByIndexes(indexes: Array<number>): Array<string> {
        return _.map(indexes, (index: number) => this.getCellByIndex(index));
    }

    /*
     * @description: return cell with given index
     */
    getCellByIndex(index: number): string {
        return this.row[index];
    }

}