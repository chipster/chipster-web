import * as _ from "lodash";

export default class TSVHeaders {

    public headers: Array<string>;

    constructor(headers: Array<string>) {
        this.headers = headers;
    }

    public size(): number {
        return this.headers.length;
    }

    public getRawHeaders(): Array<string> {
        return _.drop(this.headers, 1);
    }

    /*
     * Filter unwanted cells from row
     */
    public getItemsByIndexes(indexes: Array<number>): Array<any> {
        return _.map(indexes, index => this.headers[index]);
    }

    /*
     * Get index for the key
     */
    public getColumnIndexByKey(key: string): number {
        return _.findIndex(this.headers, (header: string) => header === key);
    }

}