import TSVRow from "./TSVRow";
import { map, filter, find } from "lodash-es";

export default class TSVBody {
  rows: Array<TSVRow>;

  constructor(tsvBody: Array<Array<string>>) {
    this.rows = this.createRows(tsvBody);
  }

  private createRows(tsvBody: Array<Array<string>>): Array<TSVRow> {
    return map(tsvBody, (row: Array<string>, index: number) => new TSVRow(row, index.toString()));
  }

  /*
   * @description: Count of bodyrows
   */
  public size(): number {
    return this.rows.length;
  }

  /*
   * @description: Get rows with ids
   *
   * The ids go to a set first, because a selection rectangle can cover every row
   * of the file and searching an array of that size for each of them takes
   * seconds.
   */
  public getTSVRows(ids: Array<string>): Array<TSVRow> {
    const idSet = new Set(ids);
    return filter(this.rows, (row: TSVRow) => idSet.has(row.id.toString()));
  }

  /*
   * @description: Get single tsvRow with ids
   */
  public getTSVRow(id: string): TSVRow {
    return find(this.rows, (row: TSVRow) => row.id === id);
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
    return map(tsvRows, (tsvRow: TSVRow) => tsvRow.row);
  }
}
