/*
 expressionprofileTSV service is replaced with this visualizationTSVservice as all the methods
 are used by other visualization components also
 */
import { Injectable } from "@angular/core";
import GeneExpression from "../../views/sessions/session/visualization/expressionprofile/geneexpression";
import TSVRow from "../../model/tsv/TSVRow";
import DomainBoundaries from "../../views/sessions/session/visualization/expressionprofile/domainboundaries";
import TSVHeaders from "../../model/tsv/TSVHeaders";
import TSVFile from "../../model/tsv/TSVFile";
import * as _ from "lodash";
import { PlotData } from "../../views/sessions/session/visualization/model/plotData";

@Injectable()
export class VisualizationTSVService {
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
    return _.map(tsv.body.rows, (row: TSVRow) =>
      this.getGeneExpressionsByIndex(row, chipIndexes)
    );
  }

  /*
   * max & min value from two-dimensional array
   */
  public getDomainBoundaries(tsv: TSVFile): DomainBoundaries {
    const chipIndexes = this.getChipHeaderIndexes(tsv.headers);
    const values = _.map(tsv.body.rows, (row: TSVRow) =>
      row.getCellsByIndexes(chipIndexes)
    );
    const flatValues = _.map(_.flatten(values), (value: string) =>
      parseFloat(value)
    );
    const min = _.min(flatValues);
    const max = _.max(flatValues);
    return new DomainBoundaries(min, max);
  }

  /*
   * Return array containing numbers indicating indexes for column headers starting with 'chip.'
   */
  public getChipHeaderIndexes(tsvHeaders: TSVHeaders): Array<number> {
    return _.chain(tsvHeaders.headers)
      .map((cell: string, index: number) =>
        _.startsWith(cell, "chip.") ? index : -1
      )
      .filter((cell: number) => cell !== -1)
      .value();
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
  getGeneExpressionsByIndex(
    row: TSVRow,
    indexes: Array<number>
  ): GeneExpression {
    const values = row.getCellsByIndexes(indexes);
    const numberValues = _.map(values, (value: string) => parseFloat(value));
    return new GeneExpression(row.id, numberValues);
  }

  /*
   * Order body by first chip-value in each row
   */
  public orderBodyByFirstValue(
    geneExpressions: Array<GeneExpression>
  ): Array<GeneExpression> {
    return _.orderBy(geneExpressions, [
      (geneExpression: GeneExpression) => _.first(geneExpression.values)
    ]);
  }

  /*
   * Get chip-value headers
   */
  public getChipHeaders(tsv: TSVFile): Array<string> {
    const chipHeaderIndexes = this.getChipHeaderIndexes(tsv.headers);
    return tsv.headers.getItemsByIndexes(chipHeaderIndexes);
  }

  public getMinY(plotData: Array<PlotData>): number {
    return plotData.reduce(
      (min, p) => (p.plotPoint.y < min ? p.plotPoint.y : min),
      plotData[0].plotPoint.y
    );
  }
  public getMaxY(plotData: Array<PlotData>): number {
    return plotData.reduce(
      (max, p) => (p.plotPoint.y > max ? p.plotPoint.y : max),
      plotData[0].plotPoint.y
    );
  }

  public getMinX(plotData: Array<PlotData>): number {
    return plotData.reduce(
      (min, p) => (p.plotPoint.x < min ? p.plotPoint.x : min),
      plotData[0].plotPoint.x
    );
  }
  public getMaxX(plotData: Array<PlotData>): number {
    return plotData.reduce(
      (max, p) => (p.plotPoint.x > max ? p.plotPoint.x : max),
      plotData[0].plotPoint.x
    );
  }
}
