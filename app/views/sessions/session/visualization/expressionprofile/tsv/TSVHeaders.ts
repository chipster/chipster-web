import * as _ from "lodash";

export default class TSVHeaders {

    public headers: Array<string>;

    constructor(headers: Array<string>) {
        this.headers = ['index', ...headers];  // headers containing 'index' by default. Index is used to indentificate TSVBody's data later
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

}