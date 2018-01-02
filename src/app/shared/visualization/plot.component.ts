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
import {RestErrorService} from "../../core/errorhandler/rest-error.service";
import {AppInjector} from "../../app-injector";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../model/loadstate";
@Component({})

export class PlotComponent implements OnChanges {

  @Input()
  dataset: Dataset;
  tsv: TSVFile;
  plotData: Array<PlotData> = [];
  svg;
  selectedXAxisHeader: string;
  selectedYAxisHeader: string;
  dataSelectionModeEnable: boolean = false;
  dragStartPoint:Point;
  dragEndPoint:Point;
  selectedDataPointIds:Array<string>;
  selectedDataRows:Array<TSVRow>=[];
  startPoint:Point;
  svgPadding=50;
  protected fileResource:FileResource;
  protected sessionDataService:SessionDataService;
  private errorHandlerService: RestErrorService;

  protected unsubscribe: Subject<any> = new Subject();
  protected state: LoadState;

  constructor(
    fileResource: FileResource,
    sessionDataService: SessionDataService) {
    this.fileResource=fileResource;
    this.sessionDataService=sessionDataService;
    this.errorHandlerService = AppInjector.get(RestErrorService);
  }


  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    const rowLimit = 5000;
    const datasetName = this.dataset.name;

    //Get the file, this can be in a shared dataservice
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);
        this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
        if (this.tsv.body.size() > rowLimit) {
          this.state = new LoadState(State.Fail, "Plot Visualization is not allowed for TSV files with more than 5000 data points");
        } else {
          this.checkTSVHeaders(); // will set this.state
        }
      }, (error: any) => {
        this.state = new LoadState(State.Fail, "Loading data failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /** @description To check whether the file has the required column headers to create the visualization**/
  checkTSVHeaders() {

  }
  /** @description Extract the data to draw the plot**/
  populatePlotData() {

  }

  /** @description manipulation of the svg**/
  drawPlot() {
    this.dataSelectionModeEnable = false;

    //creating drag element
    let drag = d3.drag();
    this.svg.call(drag);

    //Creating the selection area
    let dragGroup = this.svg.append("g").attr('id', 'dragGroup');

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
        this.resetSelectionRectangle();
      }
    });

  }

  resetSelectionRectangle(){
    this.startPoint = new Point(-1, -1);
    d3.select('.band').attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);
  }
  getSelectedDataSet(){}

  setSelectionStyle(id: string) {}

  removeSelectionStyle(id: string) {}

  resetSelections(): void {
    for (let id of this.selectedDataPointIds) {
      this.removeSelectionStyle(id);
    }
    this.selectedDataRows = [];
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

  /** @description New Dataset Creation  from selected data points **/
  createDatasetFromSelected() {}

  // Redraw the svg with the changed width of the window
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.redrawPlot();

  }

}

