import {Component, Input, OnChanges} from "@angular/core";
import * as d3 from "d3";
import Dataset from "../../../../../model/session/dataset";
import {VisualizationTSVService} from "../visualizationTSV.service";
import {FileResource} from "../../../../../shared/resources/fileresource";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {SessionDataService} from "../../sessiondata.service";
import Point from "../model/point";
import GeneExpression from "../expressionprofile/geneexpression";
import UtilsService from "../../../../../shared/utilities/utils";
import TSVRow from "../../../../../model/tsv/TSVRow";
import {ScatterPlotService} from "./scatterplot.service"
import {line} from "d3-shape";
import {PlotData} from "./plotData"

@Component({
  selector: 'ch-scatter-plot',
  templateUrl: './scatterplot.html'

})

export class ScatterPlotComponent implements OnChanges {

  @Input()
  private dataset: Dataset;
  private tsv: TSVFile;
  private errorMessage: string;
  private plotData: Array<PlotData>;
  private chipHeaders: Array<string> = [];
  private selectedChipHeadX: string;
  private selectedChipHeadY: string;
  private svg;
  private selectedGeneData: Array<GeneExpression>;
  private selectedGeneIds: Array<string>;
  private selectedGeneRows: Array<TSVRow> = [];// contain the tsv rows for the selected Genes
  private dataSelectionModeEnable: boolean = false;
  private scatterPlotVisible: boolean = false;


  constructor(private visualizationTSVService: VisualizationTSVService,
              private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private scatterPlotService: ScatterPlotService) {

  }

  ngOnChanges() {

    let self = this;
    const datasetName = this.dataset.name;
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);
        this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
        if (this.visualizationTSVService.containsChipHeaders(this.tsv)) {
          //Extracting header name without chip prefix
          this.visualizationTSVService.getChipHeaders(this.tsv).forEach(function (chipHeader) {
            self.scatterPlotVisible=true;
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
          self.scatterPlotVisible=false;
        }
      })


  }

  /*Load the data points for the scatterPlot*/
  populateDataSet(tsv: TSVFile) {
    this.plotData = [];
    let self = this;
    let geneValue = this.visualizationTSVService.getGeneExpressions(tsv);
    let orderedGenesValues = this.visualizationTSVService.orderBodyByFirstValue(geneValue);

    // Creating points for scatter plot combining two chip columns
    orderedGenesValues.forEach(function (geneRow) {
      let curPlotData = new PlotData();
      curPlotData.geneID = geneRow.id;
      curPlotData.plotPoint = new Point(geneRow.values[self.chipHeaders.indexOf(self.selectedChipHeadX)], geneRow.values[self.chipHeaders.indexOf(self.selectedChipHeadY)]);
      self.plotData.push(curPlotData);
    });
    this.drawScatterPlot(tsv);

  }

  drawScatterPlot(tsv: TSVFile) {
    this.dataSelectionModeEnable = false;
    var self = this;
    let scatterPlotWidth = document.getElementById('scatterplot').offsetWidth;

    const margin = {top: 20, right: 40, bottom: 50, left: 40};
    let size = {width: scatterPlotWidth - 50, height: 500};
    let scatterPlotArea = {
      width: size.width,
      height: size.height - margin.top - margin.bottom
    };

    //Define the SVG
    this.svg.attr('width', size.width + margin.left + margin.right).attr('height', size.height).attr('id', 'svg').style('margin-top', margin.top + 'px');


    //Adding the X-axis
    let xScale = d3.scaleLinear().range([0, scatterPlotArea.width])
      .domain([this.visualizationTSVService.getDomainBoundaries(tsv).min, this.visualizationTSVService.getDomainBoundaries(tsv).max]).nice();
    let xAxis = d3.axisBottom(xScale).ticks(5).tickSize(-scatterPlotArea.height).tickSizeOuter(0);
    ;
    this.svg.append('g')
      .attr('class', 'x axis').attr('transform', 'translate(' + margin.left + ',' + scatterPlotArea.height + ')')
      .call(xAxis);

    //Adding the Y-axis
    let yScale = d3.scaleLinear().range([scatterPlotArea.height, 0])
      .domain([this.visualizationTSVService.getDomainBoundaries(tsv).min, this.visualizationTSVService.getDomainBoundaries(tsv).max]).nice();
    let yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-scatterPlotArea.width).tickSizeOuter(0);
    ;
    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + margin.left + ',0 )')
      .call(yAxis);

    let drag = d3.drag();
    this.svg.call(drag);

    //Add the points in the svg
    this.svg.selectAll(".dot").data(self.plotData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr('id', (d: PlotData) => 'dot' + d.geneID)
      .attr("r", 2)
      .attr("cx", function (d) {
        return xScale(d.plotPoint.x);
      })
      .attr("cy", function (d) {
        console.log(d);
        return yScale(d.plotPoint.y);
      })
      .attr("fill", "red")
      .on('mouseover', (d: any) => {

      })
      .on('mouseout', (d: any) => {

      })
      .on('click', (d: PlotData) => {
        //Need to store the datapoints what the user has clicked
        console.log(d.geneID);

      });


    //Creating the selection area
    let dragGroup = this.svg.append("g").attr('id', 'dragGroup')
      .attr('transform', 'translate(' + margin.left + ',0)');

    let band = dragGroup.append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "band")
      .attr('id', 'band')
      .style("fill", "none").style("stroke", "blue").style("stroke-width", 1);

    let bandPos = [-1, -1];
    let startPoint = new Point(-1, -1);

    //Register for drag handlers
    drag.on("drag", () => {
      this.dataSelectionModeEnable = true;//change the tab for showing selected gene
      let pos = d3.mouse(document.getElementById('dragGroup'));
      let endPoint = new Point(pos[0], pos[1]);
      console.log("enddPoint" + endPoint);
      if (endPoint.x < startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + startPoint.y + ")");
      }
      if (endPoint.y < startPoint.y) {
        d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + startPoint.y + ")");
      }
      if (endPoint.y < startPoint.y && endPoint.x > startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + (startPoint.x) + "," + endPoint.y + ")");
      }

      // Set new position of band
      if (startPoint.x === -1) {
        startPoint = new Point(endPoint.x, endPoint.y);
        d3.select(".band").attr("transform", "translate(" + (startPoint.x) + "," + startPoint.y + ")");
      }
      d3.select(".band").transition().duration(1)
        .attr("width", Math.abs(startPoint.x - endPoint.x))
        .attr("height", Math.abs(startPoint.y - endPoint.y));

    });

    drag.on("end", () => {
      let pos = d3.mouse(document.getElementById('dragGroup'));
      let endPoint = new Point(pos[0], pos[1]);
      // need to get the points that included in the band
      console.log(endPoint);
      if ((startPoint.x !== -1 && startPoint.y !== -1) && ((startPoint.x !== endPoint.x) && (startPoint.y !== endPoint.y))) {
        //this.resetSelections();
        //define the points that are within the drag boundary
        let dragEndPoint = new Point(endPoint.x, endPoint.y);
        let dragStartPoint = new Point(startPoint.x, startPoint.y);
        this.selectedGeneIds = this.scatterPlotService.getSelectedGeneIds(dragStartPoint, dragEndPoint, xScale, yScale, this.plotData);

        //Populate the selected gene list to show in the selected box view{
        this.selectedGeneRows = tsv.body.getTSVRows(this.selectedGeneIds);
        this.addSelectedDataIds(this.selectedGeneIds);
        resetSelectionRectangle();

        this.selectedGeneIds.forEach(function (selectedId) {
          self.setSelectionStyle(selectedId);
        });


      }

    });

    // Hide the Rectangle after drag ends
    function resetSelectionRectangle() {
      startPoint = new Point(-1, -1);
      d3.select('.band').attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);
    }

  }

  // Do the stylings for the selected nodes
  addSelectedDataIds(id: Array<string>) {


  }

  setSelectionStyle(id: string) {
    d3.select('#dot' + id).classed('selected', true).style('fill', 'blue').attr('r', 3);
  }

  removeSelectionStyle(id: string) {
    d3.select('#dot' + id).classed('selected', false).style('fill', 'red').attr('r', 2);

  }

  getSelectionDataIds(): Array<string> {
    return this.selectedGeneData.map((geneData: GeneExpression) => geneData.id);
  }

  resetSelections(): void {
    this.removeSelectedPoints(this.getSelectionDataIds());
    this.selectedGeneData.length = 0;

  }

  removeSelectedPoints(ids: Array<string>): void {
    // Need to remove the set of points that are previously selected
    //Should get the points
    for (let id of ids) {
      this.removeSelectionStyle(id);
    }
  }


  setChipSelectionY(event) {
    this.selectedChipHeadY = event;
    this.redrawScatterPlot();
  }

  setChipSelectionX(event) {
    this.selectedChipHeadX = event;
    this.redrawScatterPlot();

  }

  redrawScatterPlot() {
    this.svg.remove();
    this.svg = d3.select("#scatterplot").append('svg');
    this.populateDataSet(this.tsv);

  }


  isSelectionVisible(): boolean {
    return this.dataSelectionModeEnable;
  }

  //New Dataset Creation  from selected datapoints
  createDatasetFromSelected() {
    let tsvData = this.tsv.getRawDataByRowIds(this.selectedGeneIds);
    let data = d3.tsvFormatRows(tsvData);
    console.log(data);
    this.sessionDataService.createDerivedDataset('newDataset.tsv', [this.dataset.datasetId], "Scatter Plot", data).subscribe();

  }


}




