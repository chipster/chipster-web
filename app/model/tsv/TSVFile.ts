import * as _ from "lodash";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
import TSVRow from "./TSVRow";

export default class TSVFile {

    public headers: TSVHeaders;
    public body: TSVBody;

    constructor(tsv: Array<Array<string>>, public datasetId: string, public filename: string) {
        // normalize header-row in tsv-file so that if headers are missing a column
        // or identifier is indicated by an empty string
        const normalizedHeaders = this.getNormalizeHeaders(tsv);
        this.headers = new TSVHeaders(normalizedHeaders);
        this.body = new TSVBody(_.tail(tsv));
        datasetId;
        filename;
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
     * @description: Get values from TSVbody column by given header-key
     */
    public getColumnDataByHeaderKey( key: string ): Array<string> {
        let columnIndex = this.getColumnIndex(key);
        return _.map(this.body.rows, (tsvRow: TSVRow) => tsvRow.row[columnIndex]);
    }

    /*
     * @description: get column index matching
     */
    public getColumnIndex(key: string): number {
        return this.headers.getColumnIndexByKey(key);
    }

    private getNormalizeHeaders(tsv: Array<Array<string>>) {
        const isMissingHeader = this.isMissingHeader(tsv);
        let headers = tsv[0];

        if(isMissingHeader) {
            headers.unshift('identifier');
            return headers;
        }

        if(headers.indexOf(' ') !== -1) {
            headers[headers.indexOf(' ')] = 'identifier';
            return headers;
        }

        return headers;
    }

    private isMissingHeader(tsv: Array<Array<string>>) {
        return tsv[0].length < tsv[1].length;
    }

}