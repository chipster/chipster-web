
import TSVFile from "./TSVFile";
import TSVRow from "./TSVRow";
export default class TSVColumn {

    data: Array<string>;
    key: string;

    constructor(tsv: TSVFile, key: string) {
        this.key = key;
        let dataIndex = tsv.isHeadersMissingCell ? tsv.headers.getColumnIndexByKey(key) + 1 : tsv.headers.getColumnIndexByKey(key);
        this.data = _.map(tsv.body.rows, (tsvRow: TSVRow) => tsvRow.row[dataIndex]);
    }

}