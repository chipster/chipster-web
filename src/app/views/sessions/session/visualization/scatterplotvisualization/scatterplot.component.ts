import {Component, Input, OnChanges} from "@angular/core";
import * as d3 from "d3";
import Dataset from "../../../../../model/session/dataset";
import {ExpressionProfileTSVService} from "../expressionprofile/expressionprofileTSV.service";
import {FileResource} from "../../../../../shared/resources/fileresource";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {SessionDataService} from "../../sessiondata.service";
import Point from "../model/point";


@Component({
  selector: 'ch-scatter-plot',
  templateUrl: './scatterplot.html'

})

export class ScatterPlotComponent implements OnChanges {

  @Input()
  private dataset: Dataset;
  private tsv: TSVFile;
  private errorMessage: string;
  private plotData: Array<Point>;
  private chipHeaders: Array<string> = [];
  private selectedChipHeadX: string;
  private selectedChipHeadY: string;
  private svg;


  constructor(private expressionProfileTSVService: ExpressionProfileTSVService,
              private fileResource: FileResource,
              private sessionDataService: SessionDataService) {

  }

  ngOnChanges() {
    let self = this;
    const datasetName = this.dataset.name;
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);
        this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
        if (this.expressionProfileTSVService.containsChipHeaders(this.tsv)) {
          //Extracting header name without chip prefix
          this.expressionProfileTSVService.getChipHeaders(this.tsv).forEach(function (chipHeader) {
            chipHeader = chipHeader.split(".").pop();
            self.chipHeaders.push(chipHeader);
          });
          if (this.chipHeaders.length > 2) {
            this.svg = d3.select("#scatterplot").append('svg');
            this.selectedChipHeadX = this.chipHeaders[0];
            this.selectedChipHeadY = this.chipHeaders[1];
            this.populateDataSet(this.tsv);
          }

        } else {
          this.errorMessage = `Only microarray data supported, didn’t find any columns starting with chip.`;
        }
      })


  }
  /*Load the data points for the scatterPlot*/
  populateDataSet(tsv: TSVFile) {
    this.plotData = [];
    let self = this;
    let geneValue = this.expressionProfileTSVService.getGeneExpressions(tsv);
    let orderedGenesValues = this.expressionProfileTSVService.orderBodyByFirstValue(geneValue);

    // Creating points for scatter plot combining two chip columns
    orderedGenesValues.forEach(function (geneRow) {
      self.plotData.push(new Point(geneRow.values[self.chipHeaders.indexOf(self.selectedChipHeadX)], geneRow.values[self.chipHeaders.indexOf(self.selectedChipHeadY)]));
    });

    this.drawScatterPlot(tsv);

  }

  drawScatterPlot(tsv: TSVFile) {
    var self = this;
    let scatterPlotWidth = document.getElementById('scatterplot').offsetWidth;

    const margin = {top: 20, right: 40, bottom: 50, left: 40};
    let size = {width: scatterPlotWidth - 100, height: 600};
    let scatterPlotArea = {
      width: size.width,
      height: size.height - margin.top - margin.bottom
    };

    //Define the SVG
    this.svg.attr('width', size.width + margin.left + margin.right).attr('height', size.height).attr('id', 'svg').style('margin-top', margin.top + 'px');


    //Adding the X-axis
    let xScale = d3.scaleLinear().range([0, scatterPlotArea.width]).domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]).nice();
    let xAxis = d3.axisBottom(xScale).ticks(5).tickSize(-scatterPlotArea.height);
    this.svg.append('g')
      .attr('class', 'x axis').attr('transform', 'translate(' + margin.left + ',' + scatterPlotArea.height + ')')
      .call(xAxis);

    //Adding the Y-axis
    let yScale = d3.scaleLinear().range([scatterPlotArea.height, 0]).domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]).nice();
    let yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-scatterPlotArea.width);
    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + margin.left + ',0 )')
      .call(yAxis);


    //Add the points in the svg
    this.svg.selectAll(".dot").data(self.plotData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("cx", function (d) {
        return xScale(d.x);
      })
      .attr("cy", function (d) {
        return yScale(d.y);
      })
      .attr("fill", "red");

  }

  setChipSelectionY(event) {
    this.selectedChipHeadY = event;
  }

  setChipSelectionX(event) {
    this.selectedChipHeadX = event;

  }

  redrawScatterPlot() {
    this.svg.remove();
    this.svg = d3.select("#scatterplot").append('svg');
    this.populateDataSet(this.tsv);

  }


}




