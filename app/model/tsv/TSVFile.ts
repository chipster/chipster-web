import * as _ from "lodash";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
import TSVRow from "./TSVRow";

export default class TSVFile {

    public headers: TSVHeaders;
    public body: TSVBody;
    public isHeadersMissingCell: boolean;
    public datasetId: string;

    constructor(tsv: Array<Array<string>>, datasetId: string) {
        this.headers = new TSVHeaders(_.head(tsv));
        this.body = new TSVBody(_.tail(tsv));
        this.isHeadersMissingCell = this.isHeadersMissingCell();
        this.datasetId = datasetId;
    }

    /*
     * @description: get raw TSVFile-data in its initial
     */
    public getRawData(ids: Array<string>): Array<Array<string>> {
        let body = this.body.getRawDataByRowIds(ids);
        let headers = this.headers.headers;
        let data = [headers, ...body];
        return data;
    }

    /*
     * @description: Headers are missing a cell, if first (or any other) datarow is longer than headerrow
     */
    private isHeadersMissingCell( ): boolean {
        return this.headers.size() !== this.body.rows[0].size();
    }

    /*
     * @description: Get values from TSVbody column by given header-key
     *
     */
    public getColumnDataByHeaderKey( key: string ): Array<string> {
        let columnIndex = this.getColumnIndex(key);
        return _.map(this.body.rows, (tsvRow: TSVRow) => tsvRow.row[columnIndex]);
    }

    /*
     * @description: get column index matching
     */
    public getColumnIndex(key: string): number {
        let columnIndex;
        if(key === 'identifier') {
            columnIndex = this.headers.getIdentifierColumnIndex(this.isHeadersMissingCell);
            if(this.isHeadersMissingCell) {
                return columnIndex;
            }
        } else {
            columnIndex = this.headers.getColumnIndexByKey(key);
        }

        return this.isHeadersMissingCell ? columnIndex + 1 : columnIndex;
    }


}