import { Injectable } from "@angular/core";
import { startsWith, map, flatten, min as _min, max as _max, chain } from "lodash-es";
import TSVFile from "../../../../../model/tsv/TSVFile";
import TSVHeaders from "../../../../../model/tsv/TSVHeaders";
import TSVRow from "../../../../../model/tsv/TSVRow";
import DomainBoundaries from "../expression-profile/domainboundaries";
import VolcanoPlotDataRow from "./volcanoPlotDataRow";

@Injectable()
export class VolcanoPlotService {
  constructor() {}

  /**
   * @description Return the index of the column containing the column header starting with "p."/"pvalue"/"padj"/"PValue"/"FDR",which will be in y axis
   */
  public getPValueHeaderIndex(tsvHeaders: TSVHeaders): Array<number> {
    return chain(tsvHeaders.headers)
      .map((cell: string, index: number) =>
        startsWith(cell, "p.") ||
        startsWith(cell, "pvalue") ||
        startsWith(cell, "padj") ||
        startsWith(cell, "PValue") ||
        startsWith(cell, "FDR")
          ? index
          : -1,
      )
      .filter((cell: number) => cell !== -1)
      .value();
  }

  /**
   * Return the index of the column containing the column header starting with "FC"/"log2FoldChange"/"logFC",which will be in x axis
   */
  public getFCValueHeaderIndex(tsvHeaders: TSVHeaders): Array<number> {
    return chain(tsvHeaders.headers)
      .map((cell: string, index: number) =>
        startsWith(cell, "FC") || startsWith(cell, "log2FoldChange") || startsWith(cell, "logFC") ? index : -1,
      )
      .filter((cell: number) => cell !== -1)
      .value();
  }

  /**
   * @description: does tsv file contain p value and FC column to make the volcano plot
   */

  public containsPValOrFCHeader(tsv: TSVFile): boolean {
    return this.getFCValueHeaderIndex(tsv.headers).length > 0 && this.getPValueHeaderIndex(tsv.headers).length > 0;
  }

  /**
   * @description: get the rows with  selected pval and fc headers
   */

  public getVolcanoPlotDataRows(
    tsv: TSVFile,
    selectedFCHeader: string,
    selectedPValHeader: string,
  ): Array<VolcanoPlotDataRow> {
    const volcanoDataIndexes = [];
    volcanoDataIndexes.push(tsv.headers.getColumnIndexByKey(selectedFCHeader));
    volcanoDataIndexes.push(tsv.headers.getColumnIndexByKey(selectedPValHeader));

    return map(tsv.body.rows, (row: TSVRow) => this.getVolcanoPlotDataRowByIndex(row, volcanoDataIndexes));
  }

  /**
   * @Description get a single volcanoPlot Data row
   */
  public getVolcanoPlotDataRowByIndex(row: TSVRow, indexes: Array<number>): VolcanoPlotDataRow {
    const values = row.getCellsByIndexes(indexes);
    const numberValues = map(values, (value: string) => parseFloat(value));
    return new VolcanoPlotDataRow(row.id, numberValues);
  }

  /**
   * @description get volcano plot P column headers
   */
  public getVolcanoPlotPColumnHeaders(tsv: TSVFile): Array<string> {
    const volcanoPlotPDataIndex = this.getPValueHeaderIndex(tsv.headers);
    return tsv.headers.getItemsByIndexes(volcanoPlotPDataIndex);
  }

  /**
   * @description get volcano plot FC column headers
   */
  public getVolcanoPlotFCColumnHeaders(tsv: TSVFile): Array<string> {
    const volcanoPlotFCDataIndex = this.getFCValueHeaderIndex(tsv.headers);
    return tsv.headers.getItemsByIndexes(volcanoPlotFCDataIndex);
  }

  /**
   * @Description get the X-domain boundary for the Fold Change columns
   */
  getVolcanoPlotDataXBoundary(tsv: TSVFile): DomainBoundaries {
    const FCIndexes = this.getFCValueHeaderIndex(tsv.headers);
    const values = map(tsv.body.rows, (row: TSVRow) => row.getCellsByIndexes(FCIndexes));
    const flatValues = map(flatten(values), (value: string) => parseFloat(value));
    const min = _min(flatValues);
    const max = _max(flatValues);

    return new DomainBoundaries(min, max);
  }

  /**
   * @Description get the Y-domain boundary for Adjusted P value Columns
   */
  getVolcanoPlotDataYBoundary(tsv: TSVFile) {
    const PValueIndexes = this.getPValueHeaderIndex(tsv.headers);
    const values = map(tsv.body.rows, (row: TSVRow) => row.getCellsByIndexes(PValueIndexes));
    const flatValues = map(flatten(values), (value: string) => parseFloat(value));

    const logValues = [];
    flatValues.forEach((yval) => {
      const curYval = -Math.log10(yval);
      // log(0) would be Infinity
      if (yval != 0) {
        logValues.push(curYval);
      }
    });
    const min = _min(logValues);
    const max = _max(logValues);

    return new DomainBoundaries(min, max);
  }
}
