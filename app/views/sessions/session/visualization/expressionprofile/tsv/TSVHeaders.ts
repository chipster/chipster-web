
import * as _ from "lodash";

export default class TSVHeaders {

    private headers: Array<string>;

    constructor(headers: Array<string>) {
        // headers containing 'index' by default. Index is used to indentificate TSVBody's data later
        this.headers = ['index', ...headers];
    }

    /*
     * Return array containing numbers indicating indexes for column headers starting with 'chip.'
     */
    public getChipIndexes(): Array<number> {
        return _.chain(this.headers)
            .map( (cell: string, index: number) => _.startsWith(cell, 'chip.') ? index : false)
            .filter( (cell: number) => _.isNumber(cell))
            .value();
    }

    public size(): number {
        return this.headers.length;
    }

    public getOriginalHeaders(): Array<string> {
        return _.drop(this.headers, 1);
    }

    /*
     * Get chip-value headers
     */
    public getChipHeaders(): Array<string> {
        return this.getItemsByIndexes(this.getChipIndexes(), this.headers);
    }

    /*
     * Filter unwanted cells from row
     */
    public getItemsByIndexes(indexes: Array<number>, row: Array<string>): Array<any> {
        return _.map( indexes, index => row[index] );
    }

}