import * as _ from "lodash";
import TSVRow from "./TSVRow";
import GeneExpression from "../geneexpression";
import DomainBoundaries from "../domainboundaries";

export default class TSVBody {

    rows: Array<TSVRow>;
    chipIndexes: Array<number>;

    constructor(tsvBody: Array<Array<string>>, chipIndexes: Array<number>) {
        this.chipIndexes = chipIndexes;
        let orderedTSVRows = this.orderBodyByFirstValue(chipIndexes, tsvBody);
        this.rows = this.createRows(orderedTSVRows);
    }

    private createRows(tsvBody: Array<Array<string>>): Array<TSVRow> {
        return _.map(tsvBody, (row: Array<string>, index: number) => {
            return new TSVRow(row, index.toString());
        });
    }

    /*
     * Length of each row in body
     */
    public rowSize(): number {
        return _.first(this.rows).size();
    }

    /*
     * Count of bodyrows
     */
    public size(): number {
        return this.rows.length;
    }

    /*
     * Get chipvalues from raw data
     */
    public getGeneExpressions(): Array<GeneExpression> {
        return _.map(this.rows, (row: TSVRow) => row.getGeneExpressionsByIndex(this.chipIndexes));
    }

    /*
     * Parse array of string to array of numbers
     */
    public parseRow(row: Array<string>): Array<number> {
        return _.map(row, value => parseFloat(value));
    }

    /*
     * create new GeneExpression from data with given id
     */
    public getGeneExpression(id: string): GeneExpression {
        return new GeneExpression(id, _.find(this.rows, (row: TSVRow) => row.id === id));
    }

    /*
     * Get rows with ids
     */
    public getTSVRows(ids: Array<string>): Array<TSVRow> {
        return _.filter(this.rows, (row: TSVRow) => _.includes(ids, row.id.toString()));
    }

    /*
     * max & min value from two-dimensional array
     */
    public getDomainBoundaries(): DomainBoundaries {
        let values = this.getGeneExpressions().map( (expression: GeneExpression) => expression.values );
        let flatValues = _.flatten(values);
        let min = _.min(flatValues);
        let max = _.max(flatValues);
        return new DomainBoundaries(min, max);
    }

    /*
     * Order csvBodyRows by values in the given index of each row
     */
    private orderByValueInIndex(rows: Array<Array<string>>, index: number): Array<Array<string>> {
        return _.orderBy(rows, [valueArray => parseFloat(valueArray[index])]);
    }

    /*
     * Order body by first chip-value in each row
     */
    private orderBodyByFirstValue(chipValueIndexes: Array<number>, rows: Array<Array<string>>): Array<Array<string>> {
        let firstChipValueIndex = _.head(chipValueIndexes);
        return this.orderByValueInIndex(rows, firstChipValueIndex);
    }

}