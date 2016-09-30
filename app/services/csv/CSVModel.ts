import * as _ from "lodash";
import DomainBoundaries from "./domainboundaries";

export default class CSVModel {

    private headers: Array<string>;
    public body: Array<Array <string>>;
    public chipValueIndexes: Array<number>;
    public domainBoundaries: DomainBoundaries;

    constructor(CSVdata: Array<Array<string>>) {
        this.addIndexToData(CSVdata); // add index information to all rows to indentificate them later
        this.headers = _.head(CSVdata);

        // Find indexes where actual chipdata is located in the arrays.
        // Note that these indexes may differ from the indexes the matching headers are located
        // since the header-row may be missing a column
        this.chipValueIndexes = this.getChipValueIndexes(CSVdata);
        this.body = this.orderBodyByFirstValue(_.tail(CSVdata));
        this.domainBoundaries = this.getDomainBoundaries();
    }

    private addIndexToData( CSVdata: Array<Array<string>> ) {
        _.head(CSVdata).unshift('index');
        _.forEach(_.tail(CSVdata), (row, index) => {
            row.unshift(index);
        });
    }

    /*
     * Get chip-value headers
     */
    public getChipHeaders(): Array<string> {
        return this.getItemsByIndexes(this.getChipColumnIndexes(), this.headers);
    }

    /*
     * Return array containing numbers indicating indexes for column headers starting with 'chip.'
     */
    public getChipColumnIndexes(): Array<number> {
        return _.chain(this.headers)
            .map( (cell, index) => _.startsWith(cell, 'chip.') ? index : false)
            .filter( cell => _.isNumber(cell))
            .value();
    }

    /*
     * Headers are missing a cell, if first (or any other) datarow is longer than headerrow
     */
    private isHeadersMissingCell(csvData: Array<Array<string>>): boolean {
        return csvData[0].length !== csvData[1].length;
    }

    /*
     * Get Indexes containing actual .chip-values
     */
    public getChipValueIndexes(csvData: Array<Array<string>>): Array<number> {
        let chipColumnIndexes = this.getChipColumnIndexes();
        return this.isHeadersMissingCell(csvData) ? _.map(chipColumnIndexes, cellIndex => cellIndex + 1) : chipColumnIndexes ;
    }

    /*
     * Filter unwanted cells from row
     */
    public getItemsByIndexes(indexes: Array<number>, row: Array<string>) {
        return _.map( indexes, index => row[index] );
    }

    /*
     * Parse array of string to array of numbers
     */
    public parseRow(row: Array<string>): Array<number> {
        return _.map(row, value => parseFloat(value));
    }

    /*
     * Get chipvalues from raw data
     */
    public getChipValues(csvBody: Array<Array<string>>): Array<number> {
        let chipValueIndexes = this.chipValueIndexes;
        return _.map(csvBody, row => this.getItemsByIndexes(chipValueIndexes, row));
    }

    /*
     * Order csvBodyRows by values in the given index of each row
     */
    private orderByValueInIndex(csvBody: Array<Array<string>>, index: number): Array<Array<string>> {
        return _.orderBy(csvBody, [ valueArray => parseFloat( valueArray[index] ) ]);
    }

    /*
     * Order csvBodyRows by first chip-value in each row
     */
    private orderBodyByFirstValue(csvBody: Array <Array<string>>): Array <Array <string>> {
        let firstChipValueIndex = _.head(this.chipValueIndexes);
        return this.orderByValueInIndex(csvBody, firstChipValueIndex);
    }

    /*
     * max & min value from two-dimensional array
     */
    getDomainBoundaries(): DomainBoundaries {
        let values = this.getChipValues(this.body);
        let flatValues = _.map(_.flatten(values), item => parseFloat(item));
        let min = _.min(flatValues);
        let max = _.max(flatValues);
        let boundaries = new DomainBoundaries(min, max);
        return boundaries;
        // return this.addThreshold(boundaries);
    }

    /*
     * Add threshold to min and max. Needed for lines to show on without being cut of on max and min
     */
    addThreshold(domainBoundaries: DomainBoundaries): DomainBoundaries {
        let min = domainBoundaries.min - domainBoundaries.min * 0.05;
        let max = domainBoundaries.max + domainBoundaries.max * 0.05;
        return new DomainBoundaries(min, max);
    }

    /*
     * Parse strings in two-dimensional array to numbers
     */
    parseValues(values: Array<string>): Array<number> {
        let result = _.map(values, value => parseFloat(value));
        return result;
    }

}