import { Component, OnChanges, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { PlotData } from "../model/plotData";
import { VolcanoPlotService } from "./volcanoplot.service";
import VolcanoPlotDataRow from "./volcanoPlotDataRow";
import Point from "../model/point";
import { PlotComponent } from "../../../../../shared/visualization/plot.component";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../session-data.service";
import { PlotService } from "../../../../../shared/visualization/plot.service";
import { LoadState, State } from "../../../../../model/loadstate";

@Component({
  selector: "ch-volcano-plot",
  templateUrl: "./volcanoplot.html",
  styleUrls: ["./volcanoplot.less"]
})
export class VolcanoPlotComponent extends PlotComponent
  implements OnChanges, OnDestroy {
  private volcanoPlotDataRows: Array<VolcanoPlotDataRow> = [];
  private volcanoPlotFCHeaders: Array<string>;
  private volcanoPlotPHeaders: Array<string>;
  private xScale: any;
  private yScale: any;

  constructor(
    private volcanoPlotService: VolcanoPlotService,
    fileResource: FileResource,
    sessionDataService: SessionDataService,
    private plotService: PlotService
  ) {
    super(fileResource, sessionDataService);
  }

  ngOnChanges() {
    super.ngOnChanges();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  checkTSVHeaders() {
    if (this.volcanoPlotService.containsPValOrFCHeader(this.tsv)) {
      // Extract the volcano plot related Headers needed to populate the list of option
      this.volcanoPlotFCHeaders = this.volcanoPlotService.getVolcanoPlotFCColumnHeaders(
        this.tsv
      );
      this.volcanoPlotPHeaders = this.volcanoPlotService.getVolcanoPlotPColumnHeaders(
        this.tsv
      );

      // Set the headers to be the first two for default setting
      if (this.volcanoPlotFCHeaders.length > 0) {
        this.selectedXAxisHeader = this.volcanoPlotFCHeaders[0];
      }
      if (this.volcanoPlotPHeaders.length > 0) {
        this.selectedYAxisHeader = this.volcanoPlotPHeaders[0];
      }

      this.redrawPlot();
      this.state = new LoadState(State.Ready);
    } else {
      this.state = new LoadState(
        State.Fail,
        "No columns starting with pvalue or fold change value found."
      );
    }
  }

  populatePlotData() {
    this.plotData = [];
    const self = this;

    // Extracting DataRows
    this.volcanoPlotDataRows = this.volcanoPlotService.getVolcanoPlotDataRows(
      this.tsv,
      this.selectedXAxisHeader,
      this.selectedYAxisHeader
    );
    this.volcanoPlotDataRows.forEach(function(dataRow) {
      const curPlotData = new PlotData();
      curPlotData.id = dataRow.id;
      // Need to do some Manipulation for the Y-Values about the Rounding Limit stuff
      curPlotData.plotPoint = new Point(
        dataRow.values[0],
        -Math.log10(dataRow.values[1])
      );
      self.plotData.push(curPlotData);
    });
    this.drawPlot();
  }

  drawPlot() {
    super.drawPlot();

    const self = this;
    const size = {
      width: document.getElementById("volcanoplot").offsetWidth,
      height: 600
    };
    const padding = 50;

    // Define the SVG
    this.svg
      .attr("width", size.width)
      .attr("height", size.height)
      .attr("id", "svg");

    // Adding the X-axis
    this.xScale = d3
      .scaleLinear()
      .range([padding, size.width - padding])
      .domain([
        this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).min,
        this.volcanoPlotService.getVolcanoPlotDataXBoundary(this.tsv).max
      ])
      .nice();

    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(10)
      .tickSize(-(size.height - padding))
      .tickPadding(5);
    this.svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (size.height - padding) + ")")
      .attr("shape-rendering", "crispEdges")
      .call(xAxis);

    // Adding the Y-Axis with log scale
    this.yScale = d3
      .scaleLinear()
      .range([size.height - padding, padding])
      .domain([
        0,
        this.volcanoPlotService.getVolcanoPlotDataYBoundary(this.tsv).max
      ])
      .nice();
    const yAxis = d3
      .axisLeft(this.yScale)
      .ticks(10)
      .tickSize(-size.width)
      .tickSizeOuter(0)
      .tickPadding(5);
    this.svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + padding + ",0)")
      .attr("shape-rendering", "crispEdges")
      .call(yAxis);

    this.svg.selectAll(".tick line").attr("opacity", 0.3);
    this.svg.selectAll(".tick text").style("font-size", "12px");

    // Appending text label for the x axis
    this.svg
      .append("text")
      .attr(
        "transform",
        "translate(" + size.width / 2 + "," + (size.height - padding / 3) + ")"
      )
      .style("text-anchor", "middle")
      .text("fold change (log2)");

    this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        "translate(" + padding / 2 + "," + size.height / 2 + ")rotate(-90)"
      )
      .text("-log(p)");

    // add the points
    this.svg
      .selectAll(".dot")
      .data(self.plotData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("id", (d: PlotData) => "dot" + d.id)
      .attr("r", 2)
      .attr("cx", function(d) {
        return self.xScale(d.plotPoint.x);
      })
      .attr("cy", function(d) {
        return self.yScale(d.plotPoint.y);
      })
      .attr("fill", function(d) {
        if (
          d.plotPoint.y >= -Math.log10(0.05) &&
          Math.abs(d.plotPoint.x) >= 1
        ) {
          if (d.plotPoint.x < 0) {
            return "green";
          } else {
            return "red";
          }
        } else {
          return "black";
        }
      });
  }

  getSelectedDataSet() {
    const self = this;
    this.selectedDataPointIds = this.plotService.getSelectedDataPoints(
      this.dragStartPoint,
      this.dragEndPoint,
      this.xScale,
      this.yScale,
      this.plotData
    );
    // Populate the selected Data Rows
    this.selectedDataRows = this.tsv.body.getTSVRows(this.selectedDataPointIds);
    this.resetSelectionRectangle();
    // change the color of the selected data points
    this.selectedDataPointIds.forEach(function(selectedId) {
      self.setSelectionStyle(selectedId);
    });
  }

  setSelectionStyle(id: string) {
    d3.select("#dot" + id)
      .classed("selected", true)
      .style("stroke", "black")
      .style("stroke-width", 3)
      .attr("r", 2);
  }

  removeSelectionStyle(id: string) {
    // this need the coloring function
    d3.select("#dot" + id)
      .classed("selected", true)
      .style("stroke", "none")
      .attr("r", 2);
  }

  redrawPlot() {
    this.plot = d3.select("#volcanoplot");
    super.clearPlot();
    this.svg = this.plot.append("svg");
    this.populatePlotData();
  }

  // new Dataset creation
  createDatasetFromSelected() {
    const tsvData = this.tsv.getRawDataByRowIds(this.selectedDataPointIds);
    const data = d3.tsvFormatRows(tsvData);
    this.sessionDataService
      .createDerivedDataset(
        "newDataset.tsv",
        [this.dataset.datasetId],
        "Volcano Plot",
        data
      )
      .subscribe();
  }
}
