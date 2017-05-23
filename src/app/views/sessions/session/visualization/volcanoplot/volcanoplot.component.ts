import {Component, Input, OnChanges, HostListener} from '@angular/core';
import * as d3 from "d3";
import Dataset from "../../../../../model/session/dataset";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {PlotData} from "../model/plotData";
import {VisualizationTSVService} from "../visualizationTSV.service";
import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import {VolcanoPlotService} from "./volcanoplot.service";
import {tsv} from "d3-request";
import VolcanoPlotDataRow from "./volcanoPlotDataRow";
import Point from "../model/point";


@Component({
  selector: 'ch-volcano-plot',
  templateUrl: './volcanoplot.html'
})

export class VolcanoPlotComponent implements OnChanges {
  @Input()
  private dataset: Dataset;
  private tsv: TSVFile;
  private errorMessage: string;
  private volcanoPlotVisible: boolean = false;
  private svg;
  private selectedXAxisHeader: string;
  private selectedYAxisHeader: string;
  private volcanoPlotData: Array<PlotData> = [];
  private volcanoPlotDataRows: Array<VolcanoPlotDataRow> = [];
  private dataSelectionModeEnable: boolean = false;
  private volcanoPlotFCHeaders:Array<string>;
  private volcanoPlotPHeaders:Array<string>;

  constructor(private visualizationTSVService: VisualizationTSVService,
              private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private volcanoPlotService: VolcanoPlotService) {

  }

  ngOnChanges() {
    const rowLimit = 5000;
    const datasetName = this.dataset.name;

    //Get the file, this can be in a shared dataservice
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);
        this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
        if (this.tsv.body.size() > rowLimit) {
          this.errorMessage = 'Volcano Plot Visualization is not allowed for TSV files with more than 5000 data points';
          this.volcanoPlotVisible = false;
        }
        else if (this.volcanoPlotService.containsPValOrFCHeader(this.tsv)) {
          this.volcanoPlotVisible = true;
          //Extract the volcano plot related Headers needed to populate the list of option
          this.volcanoPlotFCHeaders = this.volcanoPlotService.getVolcanoPlotFCColumnHeaders(this.tsv);
          this.volcanoPlotPHeaders = this.volcanoPlotService.getVolcanoPlotPColumnHeaders(this.tsv);

          // Set the headers to be the first two for default setting
          if (this.volcanoPlotFCHeaders.length > 0) {
            this.selectedXAxisHeader = this.volcanoPlotFCHeaders[0];
          }
          if (this.volcanoPlotPHeaders.length > 0) {
            this.selectedYAxisHeader = this.volcanoPlotPHeaders[0];
          }

          //Extracting DataRows
          this.volcanoPlotDataRows = this.volcanoPlotService.getVolcanoPlotDataRows(this.tsv, this.selectedXAxisHeader, this.selectedYAxisHeader);

          this.svg = d3.select("#volcanoplot").append('svg');
          this.populateVolcanoPlotData();

        }
      });

  }

  populateVolcanoPlotData() {
    var self = this;
    this.volcanoPlotDataRows.forEach(function (dataRow) {
      let curPlotData = new PlotData();
      curPlotData.id = dataRow.id;
      //Need to do some Manipulation for the Y-Values about the Rounding Limit stuff
      curPlotData.plotPoint = new Point(dataRow.values[0],
        -Math.log10(dataRow.values[1]));
      self.volcanoPlotData.push(curPlotData);
    });

    this.drawVolcanoPlot();

  }


  drawVolcanoPlot() {
    this.dataSelectionModeEnable = false;
    var self = this;

    let volcanoPlotWidth = document.getElementById('volcanoplot').offsetWidth;
    const margin = {top: 10, right: 10, bottom: 40, left: 10};
    let size = {width: volcanoPlotWidth - margin.left - margin.right, height: 500 - margin.top - margin.bottom};

    //Define the SVG
    this.svg.attr('width', size.width + margin.left + margin.right)
      .attr('height', size.height + margin.top + margin.bottom).attr('id', 'svg');

    //Adding the X-axis
    let xScale = d3.scaleLinear().range([0, size.width])
      .domain([this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).min, this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).max]).nice();
    let xAxis = d3.axisBottom(xScale).ticks(10).tickSize(-size.height).tickSizeOuter(0);
    this.svg.append('g')
      .attr('class', 'x axis').attr('transform', 'translate(' + margin.left + ',' + size.height + ')')
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", size.width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Log2 Fold Changes");


    // Adding the Y-Axis with log scale
    let yScale = d3.scaleLinear().range([size.height, 0])
      .domain([0, this.volcanoPlotService.getVolcanoPlotDataYBoundary(this.tsv).max]).nice();
    let yAxis = d3.axisLeft(yScale).ticks(10).tickSize(-size.width).tickSizeOuter(0);
    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + margin.left + ',0 )')
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      // We want to rotate the label so that it follows the axis orientation
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("-Log P-Value");

    // add the points
    this.svg.selectAll(".dot").data(self.volcanoPlotData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr('id', (d: PlotData) => 'dot' + d.id)
      .attr('r', 2)
      .attr('cx', function (d) {
        return xScale(d.plotPoint.x)
      })
      .attr('cy', function (d) {
        return yScale(d.plotPoint.y)
      })
      .attr('fill', function (d) {
        if (d.plotPoint.y >= -Math.log10(0.05) && Math.abs(d.plotPoint.x) >= 1) {
          if (d.plotPoint.x < 0) {
            return 'green';
          } else {
            return 'red';
          }
        } else {
          return 'black';
        }
      });

  };
}
