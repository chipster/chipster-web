import * as _ from "lodash";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
import GeneExpression from "views/sessions/session/visualization/expressionprofile/geneexpression";
import DomainBoundaries from "../domainboundaries";

export default class TSVFile {

    public headers: TSVHeaders;
    public body: TSVBody;

    constructor(tsv: Array<Array<string>>) {
        this.headers = new TSVHeaders(_.head(tsv));
        this.body = new TSVBody(_.tail(tsv), this.getChipIndexes(this.headers, _.tail(tsv)));
    }

    /*
     * return TSVFile-data in its initial form without indexes
     */
    public getTSVData(ids: Array<string>): Array<Array<string>> {
        let body = this.body.getTSVRows(ids);
        body = _.map(body, row => _.drop(row, 1));
        let headers = this.headers.getOriginalHeaders();
        let data = [headers, ...body];
        return data;
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