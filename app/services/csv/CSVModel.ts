import * as _ from "lodash";

export default class CSVModel {

    constructor(CSVdata: Array<Array<string>>) {
        this.headers = _.head(CSVdata);
        this.body = _.tail(CSVdata);
    }

    private headers: Array<string>;
    private body: Array<Array <string>>;

    /*
     * Get two-dimensional array including chipdata and headers (as first row)
     */
    public getChipData() : Array<Array<string>> {
        let chipValues = this.getChipValues();
        let chipHeaders = this.getChipHeaders();
        return [chipHeaders].concat(chipValues);
    }

    /*
     * Get actual chip-values for csv data
     */
    public getChipValues(): Array<Array<string>> {
        let indexes = this.getChipValueIndexes();
        return _.map(this.body, row => this.getCellsWithIndexes(indexes, row));
    }
    /*
     * Get chip-value headers
     */
    public getChipHeaders(): Array<string> {
        let indexes = this.getChipValueIndexes();
        return this.getCellsWithIndexes(indexes, this.headers);
    }

    /*
     * Return array containing numbers indicating indexes for column headers starting with 'chip.'
     */
    private getChipColumnIndexes(): Array<number> {
        return _.chain(this.headers)
            .map( (cell, index) => _.startsWith(cell, 'chip.') ? index : false)
            .filter( cell => _.isNumber(cell))
            .value();
    }

    /*
     * Is headers-row missing a cell
     */
    private isHeadersMissingCell(): boolean {
        return this.headers.length !== _.head(this.body).length;
    }

    /*
     * Get Indexes containing actual _chip-values
     */
    private getChipValueIndexes(): Array<number> {
        let chipColumnIndexes = this.getChipColumnIndexes();
        return this.isHeadersMissingCell() ? _.map(chipColumnIndexes, cell => cell + 1) : chipColumnIndexes;
    }

    /*
     * Filter unwanted cells from row
     */
    private getCellsWithIndexes(indexes: Array<number>, row: Array<string>) {
        return _.map( indexes, index => row[index] );
    }



}