import { Injectable } from "@angular/core";
import { map, flatten, min as _min, max as _max, startsWith, first, orderBy } from "lodash-es";
import GeneExpression from "./geneexpression";
import TSVRow from "../../../../../model/tsv/TSVRow";
import DomainBoundaries from "./domainboundaries";
import TSVHeaders from "../../../../../model/tsv/TSVHeaders";
import TSVFile from "../../../../../model/tsv/TSVFile";

@Injectable()
export class ExpressionProfileTSVService {
  /*
   * @description: does tsv-file contain .chip-headers
   */
  public containsChipHeaders(tsv: TSVFile): boolean {
    return this.getChipHeaderIndexes(tsv.headers).length > 0;
  }

  /*
   * Get chipvalues from raw data
   */
  public getGeneExpressions(tsv: TSVFile): Array<GeneExpression> {
    const chipIndexes = this.getChipHeaderIndexes(tsv.headers);
    return map(tsv.body.rows, (row: TSVRow) => this.getGeneExpressionsByIndex(row, chipIndexes));
  }

  /*
   * max & min value from two-dimensional array
   */
  public getDomainBoundaries(tsv: TSVFile): DomainBoundaries {
    const chipIndexes = this.getChipHeaderIndexes(tsv.headers);
    const values = map(tsv.body.rows, (row: TSVRow) => row.getCellsByIndexes(chipIndexes));
    const flatValues = map(flatten(values), (value: string) => parseFloat(value));
    const min = _min(flatValues);
    const max = _max(flatValues);
    return new DomainBoundaries(min, max);
  }

  /*
   * Return array containing numbers indicating indexes for column headers starting with 'chip.'
   */
  public getChipHeaderIndexes(tsvHeaders: TSVHeaders): Array<number> {
    return tsvHeaders.headers
      .map((cell: string, index: number) => (startsWith(cell, "chip.") ? index : -1))
      .filter((cell: number) => cell !== -1);
  }

  /*
   * create new GeneExpression from data with given id
   */
  public getGeneExpression(tsv: TSVFile, id: string): GeneExpression {
    const chipIndexes = this.getChipHeaderIndexes(tsv.headers);
    const tsvRow = tsv.body.getTSVRow(id);
    return this.getGeneExpressionsByIndex(tsvRow, chipIndexes);
  }

  /*
   * Return a single GeneExpression based on id for the TSVRow and the values in indexes of row
   */
  getGeneExpressionsByIndex(row: TSVRow, indexes: Array<number>): GeneExpression {
    const values = row.getCellsByIndexes(indexes);
    const numberValues = map(values, (value: string) => parseFloat(value));
    return new GeneExpression(row.id, numberValues);
  }

  /*
   * Order body by first chip-value in each row
   */
  public orderBodyByFirstValue(geneExpressions: Array<GeneExpression>): Array<GeneExpression> {
    return orderBy(geneExpressions, [(geneExpression: GeneExpression) => first(geneExpression.values)]);
  }

  /*
   * Get chip-value headers
   */
  public getChipHeaders(tsv: TSVFile): Array<string> {
    const chipHeaderIndexes = this.getChipHeaderIndexes(tsv.headers);
    return tsv.headers.getItemsByIndexes(chipHeaderIndexes);
  }
}
