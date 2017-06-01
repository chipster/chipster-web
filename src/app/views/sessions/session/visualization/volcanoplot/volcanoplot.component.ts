import {Component, Input, OnChanges, HostListener} from '@angular/core';
import * as d3 from "d3";
import {PlotData} from "../model/plotData";
import {VolcanoPlotService} from "./volcanoplot.service";
import VolcanoPlotDataRow from "./volcanoPlotDataRow";
import Point from "../model/point";
import {PlotComponent} from "../../../../../shared/visualization/plot.component";
import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import {PlotService} from "../../../../../shared/visualization/plot.service";


@Component({
  selector: 'ch-volcano-plot',
  templateUrl: './volcanoplot.html'
})

export class VolcanoPlotComponent extends PlotComponent implements OnChanges {

  private volcanoPlotDataRows: Array<VolcanoPlotDataRow> = [];
  private volcanoPlotFCHeaders: Array<string>;
  private volcanoPlotPHeaders: Array<string>;
  private xScale:any;
  private yScale:any;


  constructor(private volcanoPlotService: VolcanoPlotService,
              fileResource: FileResource,
              sessionDataService: SessionDataService,
              private plotService:PlotService) {
    super(fileResource, sessionDataService)
  }

  ngOnChanges() {
    super.ngOnChanges();

  }

  checkTSVHeaders() {
    if (this.volcanoPlotService.containsPValOrFCHeader(this.tsv)) {
      this.plotVisible = true;
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

      this.svg = d3.select("#volcanoplot").append('svg');
      this.populatePlotData();
    }
  }

  populatePlotData() {
    var self = this;

    //Extracting DataRows
    this.volcanoPlotDataRows = this.volcanoPlotService.getVolcanoPlotDataRows(this.tsv, this.selectedXAxisHeader, this.selectedYAxisHeader);
    this.volcanoPlotDataRows.forEach(function (dataRow) {
      let curPlotData = new PlotData();
      curPlotData.id = dataRow.id;
      //Need to do some Manipulation for the Y-Values about the Rounding Limit stuff
      curPlotData.plotPoint = new Point(dataRow.values[0],
        -Math.log10(dataRow.values[1]));
      self.plotData.push(curPlotData);
    });
    this.drawPlot();
  }

  drawPlot() {
    super.drawPlot();

    var self = this;
    let volcanoPlotWidth = document.getElementById('volcanoplot').offsetWidth;
    let outerWidth = volcanoPlotWidth;
    let innerWidth = outerWidth - this.svgMargin.left - this.svgMargin.right;

    let size = {
      width: innerWidth - this.svgPadding.left - this.svgPadding.right,
      height: this.svgInnerHeight - this.svgPadding.top - this.svgPadding.bottom
    };


    //Define the SVG
    this.svg.attr('width', outerWidth)
      .attr('height', this.svgOuterHeight).attr('id', 'svg')
      .append("g");

    //Adding the X-axis
    this.xScale = d3.scaleLinear().range([0, size.width])
      .domain([this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).min, this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).max]).nice();
    let xAxis = d3.axisBottom(this.xScale).ticks(10).tickSize(-size.height).tickSizeOuter(0);
    this.svg.append('g')
      .attr('class', 'x axis').attr('transform', 'translate(' + this.svgMargin.left + ',' + size.height + ')')
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", size.width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Log2 Fold Changes");


    // Adding the Y-Axis with log scale
    this.yScale = d3.scaleLinear().range([size.height, 0])
      .domain([0, this.volcanoPlotService.getVolcanoPlotDataYBoundary(this.tsv).max]).nice();
    let yAxis = d3.axisLeft(this.yScale).ticks(10).tickSize(-size.width).tickSizeOuter(0);
    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + this.svgMargin.left + ',0 )')
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
    this.svg.selectAll(".dot").data(self.plotData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr('id', (d: PlotData) => 'dot' + d.id)
      .attr('r', 2)
      .attr('cx', function (d) {
        return self.xScale(d.plotPoint.x)
      })
      .attr('cy', function (d) {
        return self.yScale(d.plotPoint.y)
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
  }

  getSelectedDataSet(){
    var self=this;
    this.selectedDataPointIds=this.plotService.getSelectedDataPoints(this.dragStartPoint,this.dragEndPoint,this.xScale,this.yScale,this.plotData);
    //Populate the selected Data Rows
    this.selectedDataRows=this.tsv.body.getTSVRows(this.selectedDataPointIds);
    this.resetSelectionRectangle();

    //change the color of the selected data points
    this.selectedDataPointIds.forEach(function(selectedId){
      self.setSelectionStyle(selectedId);
    });
  }


  setSelectionStyle(id: string) {
    d3.select('#dot' + id).classed('selected', true).style('stroke', 'black').attr('r', 2);
  }

  removeSelectionStyle(id: string) {
    // this need the coloring function
    d3.select('#dot' + id).classed('selected', true).style('stroke', 'none').attr('r', 2);


  }


  redrawPlot() {
    super.redrawPlot();
    this.svg = d3.select('#volcanoplot').append('svg');
    this.populatePlotData();
  }

  //new Dataset creation
  createDatasetFromSelected(){
    let tsvData= this.tsv.getRawDataByRowIds(this.selectedDataPointIds);
    let data=d3.tsvFormatRows(tsvData);
    this.sessionDataService.createDerivedDataset('newDataset.tsv',[this.dataset.datasetId],'Volcano Plot',data).subscribe();

  }


}
