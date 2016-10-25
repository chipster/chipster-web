import * as _ from "lodash";
import TSVRow from "./TSVRow";

export default class TSVBody {

    rows: Array<TSVRow>;

    constructor(tsvBody: Array<Array<string>>) {
        this.rows = this.createRows(tsvBody);
    }

    private createRows(tsvBody: Array<Array<string>>): Array<TSVRow> {
        return _.map(tsvBody, (row: Array<string>, index: number) => {
            return new TSVRow(row, index.toString());
        });
    }

    /*
     * Count of bodyrows
     */
    public size(): number {
        return this.rows.length;
    }

    /*
     * Get rows with ids
     */
    public getTSVRows(ids: Array<string>): Array<TSVRow> {
        return _.filter(this.rows, (row: TSVRow) => _.includes(ids, row.id.toString()));
    }

    /*
     * Get single tsvRow with ids
     */
    public getTSVRow(id: string): TSVRow {
        return _.find(this.rows, (row: TSVRow) => row.id === id);
    }

    /*
     * Get original TSVBodyrows with ids
     */
    public getRawDataByRowIds(ids: Array<string>): Array<Array<string>> {
        let tsvRows = this.getTSVRows(ids);
        return _.map(tsvRows, (tsvRow: TSVRow) => tsvRow.getRawData());
    }



}