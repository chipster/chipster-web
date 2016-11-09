import * as _ from "lodash";

export default class TSVHeaders {

    public headers: Array<string>;

    constructor(headers: Array<string>) {
        // headers containing 'index' by default. Index is used to indentificate TSVBody's data later
        this.headers = headers;
    }

    public size(): number {
        return this.headers.length;
    }

    /*
     * @description: Filter unwanted cells from row
     */
    public getItemsByIndexes(indexes: Array<number>): Array<any> {
        return _.map(indexes, index => this.headers[index]);
    }

    /*
     * @description: Get index for the key
     */
    public getColumnIndexByKey(key: string): number {
        return _.findIndex(this.headers, (header: string) => header === key);
    }

    /*
     * @description: does headers contain identifier cell
     */
    public hasIdentifierColumn(): boolean {
        return _.includes(this.headers, 'identifier');
    }

}