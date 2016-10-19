import * as _ from "lodash";
import DomainBoundaries from "../../views/sessions/session/visualization/expressionprofile/domainboundaries";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
import GeneExpression from "../../views/sessions/session/visualization/expressionprofile/geneexpression";

export default class TSVFile {

    public headers: TSVHeaders;
    public body: TSVBody;
    public domainBoundaries: DomainBoundaries;

    constructor(tsv: Array<Array<string>>) {
        this.headers = new TSVHeaders(_.head(tsv));
        this.body = new TSVBody(_.tail(tsv), this.getChipIndexes(this.headers, _.tail(tsv)));
        
        // Find indexes where actual chipdata is located in the arrays.
        // Note that these indexes may differ from the indexes the matching headers are located
        // since the header-row may be missing a column
        this.domainBoundaries = this.getDomainBoundaries();
    }

    /*
     * return TSVFile-data in its initial form without indexes
     */
    public getCSVData(ids: Array<string>) {
        let body = this.body.getTSVRows(ids);
        body = _.map(body, row => _.drop(row, 1));
        let headers = this.headers.getOriginalHeaders();
        let data = [headers, ...body];
        return data;
    }

    /*
     * max & min value from two-dimensional array
     */
    public getDomainBoundaries(): DomainBoundaries {
        let values = this.body.getGeneExpressions().map( (expression: GeneExpression) => expression.values );
        let flatValues = _.flatten(values);
        let min = _.min(flatValues);
        let max = _.max(flatValues);
        return new DomainBoundaries(min, max);
    }

    /*
     * Get Indexes containing actual .chip-values
     */
    public getChipIndexes(headers: TSVHeaders, bodyRows: Array<Array<string>> ): Array<number> {
        let chipIndexes = headers.getChipIndexes();
        // if headers is missing a cell then add
        return this.isHeadersMissingCell(headers, bodyRows) ? _.map(chipIndexes, cellIndex => cellIndex + 1 ) : chipIndexes;
    }

    /*
     * Headers are missing a cell, if first (or any other) datarow is longer than headerrow
     */
    private isHeadersMissingCell(headers, bodyRows): boolean {
        return headers.size() !== _.first(bodyRows).length;
    }

}