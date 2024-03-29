import { tail } from "lodash-es";
import TSVHeaders from "./TSVHeaders";
import TSVBody from "./TSVBody";
import TSVRow from "./TSVRow";

export const noColumnError = "NoColumnError";

export class NoColumnError extends Error {
  constructor(
    message,
    private cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
export default class TSVFile {
  public headers: TSVHeaders;
  public body: TSVBody;

  constructor(
    tsv: Array<Array<string>>,
    public datasetId: string,
    public filename: string,
  ) {
    // normalize header-row in tsv-file so that if headers are missing a column
    // or identifier is indicated by an empty string

    const normalizedHeaders = this.getNormalizeHeaders(tsv);
    this.headers = new TSVHeaders(normalizedHeaders);
    this.body = new TSVBody(tail(tsv));
    datasetId;
    filename;
  }

  /*
   * @description: return unfiltered tsv-data. Note that data is normalized.
   */
  public getRawData(): Array<Array<string>> {
    const headers = this.headers.headers;
    const body = this.body.getRawDataRows();
    return [headers, ...body];
  }

  /*
   * @description: get raw TSVFile-data in its initial form
   */
  public getRawDataByRowIds(ids: Array<string>): Array<Array<string>> {
    const headers = this.headers.headers;
    const body = this.body.getRawDataByRowIds(ids);
    return [headers, ...body];
  }

  /*
   * @description: Get values from TSVbody column by given header-key
   */
  public getColumnDataByHeaderKey(key: string): Array<string> {
    const columnIndex = this.getColumnIndex(key);
    return this.body.rows.map((tsvRow: TSVRow) => tsvRow.row[columnIndex]);
  }

  /*
   * @description: get columndata of multiple headers.
   */
  public getColumnDataByHeaderKeys(keys: Array<string>): Array<Array<string>> {
    const columnIndexes = keys.map((key: string) => this.getColumnIndex(key));

    if (columnIndexes.filter((index) => index !== -1).length === 0) {
      // throw new VError('columns "' + keys + '" not found');

      // old school way, because VError is not compatible with webpack 5
      throw new NoColumnError('columns "' + keys + '" not found');
    }

    const columnData = this.body.rows.map((tsvRow: TSVRow) => columnIndexes.map((index: number) => tsvRow.row[index]));

    return columnData;
  }

  /*
   * @description: get column index matching
   */
  public getColumnIndex(key: string): number {
    return this.headers.getColumnIndexByKey(key);
  }

  /*
   * @description: some tsv-files contain 1 less headers than bodyrows due to scripts they are generated.
   * Add missing header named 'identifier' as first header. Also if one of the headers is empty rename it as identifier
   *
   */
  private getNormalizeHeaders(tsv: Array<Array<string>>) {
    const isMissingHeader = this.isMissingHeader(tsv);
    const headers = tsv[0];

    if (!headers) {
      return [];
    }

    if (isMissingHeader) {
      headers.unshift("identifier");
      return headers;
    }

    if (headers.includes(" ")) {
      headers[headers.indexOf(" ")] = "identifier";
      return headers;
    }

    return headers;
  }

  private isMissingHeader(tsv: Array<Array<string>>) {
    if (tsv.length <= 1) {
      // have to guess
      return false;
    }
    return tsv[0].length < tsv[1].length;
  }
}
