import * as _ from "lodash";

export default class TSVHeaders {

    public headers: Array<string>;

    constructor(headers: Array<string>) {
        this.headers = headers;  // headers containing 'index' by default. Index is used to indentificate TSVBody's data later
    }

    public size(): number {
        return this.headers.length;
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

    /*
     * @return: the result column is one of the following cases:
     *      1. header row is one item shorter than first (each) row in body
     *      2. column with empty space as header ' '
     *      3. column with string 'identifier' as header
     */
    public getIdentifierColumnIndex(isHeadersMissingCell: boolean): number {

        // identifier is first column if one header is missing
        if(isHeadersMissingCell) {
            return 0;
        }

        // identifier column may be recognized by empty space -header
        if( _.findIndex(this.headers, ' ') !== -1) {
            return _.findIndex(this.headers, ' ');
        }

        return _.findIndex(this.headers, 'identifier');
    }

}