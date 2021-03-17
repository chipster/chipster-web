import { Component, OnChanges, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { PlotDirective } from "../../../../../shared/visualization/plot.directive";
import { PlotService } from "../../../../../shared/visualization/plot.service";
import { VisualizationTSVService } from "../../../../../shared/visualization/visualizationTSV.service";
import { SessionDataService } from "../../session-data.service";
import { PlotData } from "../model/plotData";
import Point from "../model/point";

@Component({
  selector: "ch-scatter-plot",
  templateUrl: "./scatterplot.html",
  styleUrls: ["./scatterplot.less"],
})
export class ScatterPlotComponent
  extends PlotDirective
  implements OnChanges, OnDestroy {
  public chipHeaders: Array<string> = [];
  private xScale: any;
  private yScale: any;

  constructor(
    fileResource: FileResource,
    sessionDataService: SessionDataService,
    private plotService: PlotService,
    private visualizationTSVService: VisualizationTSVService,
    private restErrorService2: RestErrorService
  ) {
    super(fileResource, sessionDataService);
  }

  ngOnChanges() {
    super.ngOnChanges();
  }

  showAnyway() {
    super.show(true);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  checkTSVHeaders() {
    const self = this;
    if (this.visualizationTSVService.containsChipHeaders(this.tsv)) {
      // Extracting header name without chip prefix
      this.visualizationTSVService
        .getChipHeaders(this.tsv)
        .forEach(function (chipHeader) {
          chipHeader = chipHeader.replace("chip.", "");
          self.chipHeaders.push(chipHeader);
        });
      if (this.chipHeaders.length >= 2) {
        this.selectedXAxisHeader = this.chipHeaders[0];
        this.selectedYAxisHeader = this.chipHeaders[1];
        this.redrawPlot();
        this.state = new LoadState(State.Ready);
      } else {
        this.state = new LoadState(
          State.Fail,
          "Dataset does not have enough columns to generate scatterplot."
        );
      }
    } else {
      this.state = new LoadState(
        State.Fail,
        "Only microarray data supported, no columns starting with chip. found."
      );
    }
  }

  // Load the data points for the scatterPlot
  populatePlotData() {
    this.plotData = [];
    const self = this;
    const geneValue = this.visualizationTSVService.getGeneExpressions(this.tsv);
    const orderedGenesValues = this.visualizationTSVService.orderBodyByFirstValue(
      geneValue
    );

    // Creating points for scatter plot combining two chip columns
    orderedGenesValues.forEach(function (geneRow) {
      const curPlotData = new PlotData();
      curPlotData.id = geneRow.id;
      curPlotData.plotPoint = new Point(
        geneRow.values[self.chipHeaders.indexOf(self.selectedXAxisHeader)],
        geneRow.values[self.chipHeaders.indexOf(self.selectedYAxisHeader)]
      );
      self.plotData.push(curPlotData);
    });
    this.drawPlot();
  }

  drawPlot() {
    super.drawPlot();
    const self = this;
    const size = {
      width: document.getElementById("scatterplot").offsetWidth,
      height: 600,
    };
    const padding = 50;

    // Define the SVG
    this.svg
      .attr("width", size.width)
      .attr("height", size.height)
      .attr("id", "svg");

    this.xScale = d3
      .scaleLinear()
      .range([padding, size.width - padding])
      .domain([
        this.visualizationTSVService.getMinX(self.plotData),
        this.visualizationTSVService.getMaxX(self.plotData),
      ])
      .nice();
    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(10)
      .tickSize(-(size.height - padding))
      .tickSizeOuter(5);
    this.svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (size.height - padding) + ")")
      .attr("shape-rendering", "crispEdges")
      .call(xAxis);

    // Adding the Y-axis
    this.yScale = d3
      .scaleLinear()
      .range([size.height - padding, padding])
      .domain([
        this.visualizationTSVService.getMinY(self.plotData),
        this.visualizationTSVService.getMaxY(self.plotData),
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
      .text(this.selectedXAxisHeader);

    this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        "translate(" + padding / 2 + "," + size.height / 2 + ")rotate(-90)"
      )
      .text(this.selectedYAxisHeader);

    // Add the points in the svg
    this.svg
      .selectAll(".dot")
      .data(self.plotData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("id", (d: PlotData) => "dot" + d.id)
      .attr("r", 2)
      .attr("cx", function (d) {
        return self.xScale(d.plotPoint.x);
      })
      .attr("cy", function (d) {
        return self.yScale(d.plotPoint.y);
      })
      .attr("fill", "red")
      .on("mouseover", (d: any) => {})
      .on("mouseout", (d: any) => {})
      .on("click", (d: PlotData) => {
        // Need to store the datapoints what the user has clicked
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
    // Populate the selected gene list to show in the selected box view{
    this.selectedDataRows = this.tsv.body.getTSVRows(this.selectedDataPointIds);
    this.resetSelectionRectangle();

    this.selectedDataPointIds.forEach(function (selectedId) {
      self.setSelectionStyle(selectedId);
    });
  }

  setSelectionStyle(id: string) {
    d3.select("#dot" + id)
      .classed("selected", true)
      .style("fill", "blue")
      .attr("r", 3);
  }

  removeSelectionStyle(id: string) {
    d3.select("#dot" + id)
      .classed("selected", false)
      .style("fill", "red")
      .attr("r", 2);
  }

  redrawPlot() {
    this.plot = d3.select("#scatterplot");
    super.clearPlot();
    this.svg = this.plot.append("svg");
    this.populatePlotData();
  }

  // New Dataset Creation  from selected data points
  createDatasetFromSelected() {
    const tsvData = this.tsv.getRawDataByRowIds(this.selectedDataPointIds);
    const data = d3.tsvFormatRows(tsvData);
    this.sessionDataService
      .createDerivedDataset(
        "newDataset.tsv",
        [this.dataset.datasetId],
        "Scatter Plot",
        data
      )
      .subscribe(null, (err) =>
        this.restErrorService2.showError("create dataset failed", err)
      );
  }
}
