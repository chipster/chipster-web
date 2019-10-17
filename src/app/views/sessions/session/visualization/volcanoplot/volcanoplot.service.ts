import { Injectable } from "@angular/core";
import TSVHeaders from "../../../../../model/tsv/TSVHeaders";
import TSVFile from "../../../../../model/tsv/TSVFile";
import VolcanoPlotDataRow from "./volcanoPlotDataRow";
import TSVRow from "../../../../../model/tsv/TSVRow";
import DomainBoundaries from "../expressionprofile/domainboundaries";
import * as _ from "lodash";

@Injectable()
export class VolcanoPlotService {
  constructor() {}

  /**
   * @description Return the index of the column containing the column header starting with "p."/"pvalue"/"padj"/"PValue"/"FDR",which will be in y axis
   */
  public getPValueHeaderIndex(tsvHeaders: TSVHeaders): Array<number> {
    return _.chain(tsvHeaders.headers)
      .map((cell: string, index: number) =>
        _.startsWith(cell, "p.") ||
        _.startsWith(cell, "pvalue") ||
        _.startsWith(cell, "padj") ||
        _.startsWith(cell, "PValue") ||
        _.startsWith(cell, "FDR")
          ? index
          : -1
      )
      .filter((cell: number) => cell !== -1)
      .value();
  }

  /**
   * Return the index of the column containing the column header starting with "FC"/"log2FoldChange"/"logFC",which will be in x axis
   */
  public getFCValueHeaderIndex(tsvHeaders: TSVHeaders): Array<number> {
    return _.chain(tsvHeaders.headers)
      .map((cell: string, index: number) =>
        _.startsWith(cell, "FC") ||
        _.startsWith(cell, "log2FoldChange") ||
        _.startsWith(cell, "logFC")
          ? index
          : -1
      )
      .filter((cell: number) => cell !== -1)
      .value();
  }

  /**
   * @description: does tsv file contain p value and FC column to make the volcano plot
   */

  public containsPValOrFCHeader(tsv: TSVFile): boolean {
    return (
      this.getFCValueHeaderIndex(tsv.headers).length > 0 &&
      this.getPValueHeaderIndex(tsv.headers).length > 0
    );
  }

  /**
   * @description: get the rows with  selected pval and fc headers
   */

  public getVolcanoPlotDataRows(
    tsv: TSVFile,
    selectedFCHeader: string,
    selectedPValHeader: string
  ): Array<VolcanoPlotDataRow> {
    const volcanoDataIndexes = [];
    volcanoDataIndexes.push(tsv.headers.getColumnIndexByKey(selectedFCHeader));
    volcanoDataIndexes.push(
      tsv.headers.getColumnIndexByKey(selectedPValHeader)
    );
    console.log(volcanoDataIndexes);
    return _.map(tsv.body.rows, (row: TSVRow) =>
      this.getVolcanoPlotDataRowByIndex(row, volcanoDataIndexes)
    );
  }

  /**
   * @Description get a single volcanoPlot Data row
   */
  public getVolcanoPlotDataRowByIndex(
    row: TSVRow,
    indexes: Array<number>
  ): VolcanoPlotDataRow {
    const values = row.getCellsByIndexes(indexes);
    const numberValues = _.map(values, (value: string) => parseFloat(value));
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
    const values = _.map(tsv.body.rows, (row: TSVRow) =>
      row.getCellsByIndexes(FCIndexes)
    );
    const flatValues = _.map(_.flatten(values), (value: string) =>
      parseFloat(value)
    );
    const min = _.min(flatValues);
    const max = _.max(flatValues);
    console.log(new DomainBoundaries(min, max));
    return new DomainBoundaries(min, max);
  }

  /**
   * @Description get the Y-domain boundary for Adjusted P value Columns
   */
  getVolcanoPlotDataYBoundary(tsv: TSVFile) {
    const PValueIndexes = this.getPValueHeaderIndex(tsv.headers);
    const values = _.map(tsv.body.rows, (row: TSVRow) =>
      row.getCellsByIndexes(PValueIndexes)
    );
    const flatValues = _.map(_.flatten(values), (value: string) =>
      parseFloat(value)
    );

    const logValues = [];
    flatValues.forEach(function(yval) {
      const curYval = -Math.log10(yval);
      logValues.push(curYval);
    });
    const min = _.min(logValues);
    const max = _.max(logValues);

    return new DomainBoundaries(min, max);
  }
}
