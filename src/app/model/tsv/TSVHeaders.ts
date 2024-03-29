import { findIndex, includes, map } from "lodash-es";

export default class TSVHeaders {
  public headers: Array<string>;

  constructor(headers: Array<string>) {
    // headers containing 'index' by default. Index is used to identificate TSVBody's data later
    this.headers = headers;
  }

  public size(): number {
    return this.headers.length;
  }

  /*
   * @description: Filter unwanted cells from row
   */
  public getItemsByIndexes(indexes: Array<number>): Array<any> {
    return map(indexes, (index) => this.headers[index]);
  }

  /*
   * @description: Get index for the key
   * @return: index of header and -1 if not found
   */
  public getColumnIndexByKey(key: string): number {
    return findIndex(this.headers, (header: string) => header === key);
  }

  /*
   * @description: does headers contain identifier cell
   */
  public hasIdentifierColumn(): boolean {
    return includes(this.headers, "identifier");
  }
}
