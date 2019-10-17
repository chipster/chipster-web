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
   * @description: Count of bodyrows
   */
  public size(): number {
    return this.rows.length;
  }

  /*
   * @description: Get rows with ids
   */
  public getTSVRows(ids: Array<string>): Array<TSVRow> {
    return _.filter(this.rows, (row: TSVRow) =>
      _.includes(ids, row.id.toString())
    );
  }

  /*
   * @description: Get single tsvRow with ids
   */
  public getTSVRow(id: string): TSVRow {
    return _.find(this.rows, (row: TSVRow) => row.id === id);
  }

  /*
   * @description: return all rows as raw data
   */
  public getRawDataRows(): Array<Array<string>> {
    return this.rows.map((tsvRow: TSVRow) => tsvRow.row);
  }

  /*
   * @description: Get original TSVBodyrows with ids
   */
  public getRawDataByRowIds(ids: Array<string>): Array<Array<string>> {
    const tsvRows = this.getTSVRows(ids);
    return _.map(tsvRows, (tsvRow: TSVRow) => tsvRow.row);
  }
}
