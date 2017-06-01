//Super class for scatterplot and volcanoplot

import {Component, OnChanges, Input, HostListener} from "@angular/core";
import {FileResource} from "../resources/fileresource";
import {SessionDataService} from "../../views/sessions/session/sessiondata.service";
import Dataset from "../../model/session/dataset";
import TSVFile from "../../model/tsv/TSVFile";
import {PlotData} from "../../views/sessions/session/visualization/model/plotData";
import * as d3 from "d3";
import Point from "../../views/sessions/session/visualization/model/point";
import TSVRow from "../../model/tsv/TSVRow";
@Component({})

export class PlotComponent implements OnChanges {

  @Input()
  dataset: Dataset;
  tsv: TSVFile;
  errorMessage: string;
  plotData: Array<PlotData> = [];
  svg;
  selectedXAxisHeader: string;
  selectedYAxisHeader: string;
  dataSelectionModeEnable: boolean = false;
  plotVisible: boolean = false;
  svgMargin = {top: 20, right: 20, bottom: 20, left: 20};
  svgPadding = {top: 60, right: 60, bottom: 60, left: 60};
  svgOuterHeight = 600;
  svgInnerHeight;
  dragStartPoint:Point;
  dragEndPoint:Point;
  selectedDataPointIds:Array<string>;
  selectedDataRows:Array<TSVRow>=[];
  startPoint:Point;

  protected fileResource:FileResource;
  protected sessionDataService:SessionDataService;

  constructor(fileResource: FileResource,
              sessionDataService: SessionDataService) {
    this.fileResource=fileResource;
    this.sessionDataService=sessionDataService;
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
          this.errorMessage = 'Plot Visualization is not allowed for TSV files with more than 5000 data points';
          this.plotVisible = false;
        } else {
          this.checkTSVHeaders();
        }

      });
  }

  checkTSVHeaders() {

  }

  populatePlotData() {

  }

  drawPlot() {
    this.dataSelectionModeEnable = false;
    this.svgInnerHeight = this.svgOuterHeight - this.svgMargin.top - this.svgMargin.bottom;

    //creating drag element
    let drag = d3.drag();
    this.svg.call(drag);

    //Creating the selection area
    let dragGroup = this.svg.append("g").attr('id', 'dragGroup')
      .attr('transform', 'translate(' + this.svgMargin.left + ',0)');

    let band = dragGroup.append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "band")
      .attr('id', 'band')
      .style("fill", "none").style("stroke", "blue").style("stroke-width", 1);

    let bandPos = [-1, -1];
    this.startPoint = new Point(-1, -1);

    //Register for drag handlers
    drag.on("drag", () => {
      this.dataSelectionModeEnable = true;//change the tab for showing selected gene
      let pos = d3.mouse(document.getElementById('dragGroup'));
      let endPoint = new Point(pos[0], pos[1]);
      if (endPoint.x < this.startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + this.startPoint.y + ")");
      }
      if (endPoint.y < this.startPoint.y) {
        d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + this.startPoint.y + ")");
      }
      if (endPoint.y < this.startPoint.y && endPoint.x > this.startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + (this.startPoint.x) + "," + endPoint.y + ")");
      }

      // Set new position of band
      if (this.startPoint.x === -1) {
        this.startPoint = new Point(endPoint.x, endPoint.y);
        d3.select(".band").attr("transform", "translate(" + (this.startPoint.x) + "," + this.startPoint.y + ")");
      }
      d3.select(".band").transition().duration(1)
        .attr("width", Math.abs(this.startPoint.x - endPoint.x))
        .attr("height", Math.abs(this.startPoint.y - endPoint.y));

    });

    drag.on("end", () => {
      let pos = d3.mouse(document.getElementById('dragGroup'));
      let endPoint = new Point(pos[0], pos[1]);
      // need to get the points that included in the band
      if ((this.startPoint.x !== -1 && this.startPoint.y !== -1) && ((this.startPoint.x !== endPoint.x) && (this.startPoint.y !== endPoint.y))) {
        //this.resetSelections();
        //define the points that are within the drag boundary
        this.dragEndPoint = new Point(endPoint.x, endPoint.y);
        this.dragStartPoint = new Point(this.startPoint.x, this.startPoint.y);
        this.getSelectedDataSet();
      }
    });

  }

  resetSelectionRectangle(){
    this.startPoint = new Point(-1, -1);
    d3.select('.band').attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);

  }
  getSelectedDataSet(){

  }

  setSelectionStyle(id: string) {

  }

  removeSelectionStyle(id: string) {

  }

  resetSelections(): void {
    for (let id of this.selectedDataPointIds) {
      this.removeSelectionStyle(id);
    }
  }

  setXAxisHeader(event) {
    this.selectedXAxisHeader = event;
    this.redrawPlot();
  }

  setYAxisHeader(event) {
    this.selectedYAxisHeader = event;
    this.redrawPlot();
  }

  redrawPlot() {
    this.svg.remove();

  }

  //New Dataset Creation  from selected datapoints
  createDatasetFromSelected() {

  }

  // Redraw the svg with the changed width of the window
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.redrawPlot();

  }

}

