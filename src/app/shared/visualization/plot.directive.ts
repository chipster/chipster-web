// Super class for scatterplot and volcanoplot

import {
  Directive,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
} from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AppInjector } from "../../app-injector";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../model/loadstate";
import TSVFile from "../../model/tsv/TSVFile";
import TSVRow from "../../model/tsv/TSVRow";
import { SessionDataService } from "../../views/sessions/session/session-data.service";
import { PlotData } from "../../views/sessions/session/visualization/model/plotData";
import Point from "../../views/sessions/session/visualization/model/point";
import { FileResource } from "../resources/fileresource";

@Directive()
export abstract class PlotDirective implements OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;
  tsv: TSVFile;
  plotData: Array<PlotData> = [];
  plot;
  svg;
  selectedXAxisHeader: string;
  selectedYAxisHeader: string;
  dataSelectionModeEnable = false;
  dragStartPoint: Point;
  dragEndPoint: Point;
  selectedDataPointIds: Array<string>;
  selectedDataRows: Array<TSVRow> = [];

  svgPadding = 50;
  protected fileResource: FileResource;
  protected sessionDataService: SessionDataService;
  private restErrorService: RestErrorService;

  protected unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  constructor(
    fileResource: FileResource,
    sessionDataService: SessionDataService
  ) {
    this.fileResource = fileResource;
    this.sessionDataService = sessionDataService;
    this.restErrorService = AppInjector.get(RestErrorService);
  }

  ngOnChanges() {
    this.state = new LoadState(State.Loading, "Loading data...");
    setTimeout(() => this.show(false), 100);
  }

  show(showMore: boolean) {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();

    this.clearPlot();

    let rowLimit = 5000;
    if (showMore) {
      rowLimit = 50000;
    }

    const datasetName = this.dataset.name;

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    // Get the file, this can be in a shared dataservice
    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          const parsedTSV = d3.tsvParseRows(result);
          this.tsv = new TSVFile(
            parsedTSV,
            this.dataset.datasetId,
            datasetName
          );
          if (this.tsv.body.size() > rowLimit) {
            if (showMore) {
              this.state = new LoadState(
                State.Fail,
                "Plot visualization is not allowed for TSV files with more than " +
                  rowLimit +
                  " data points"
              );
            } else {
              this.state = new LoadState(
                State.TooLarge,
                "Plot visualization may be slow for TSV files with more than " +
                  rowLimit +
                  " data points",
                "Show anyway"
              );
            }
          } else {
            this.checkTSVHeaders(); // will set this.state
          }
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /** @description To check whether the file has the required column headers to create the visualization**/
  checkTSVHeaders() {}
  /** @description Extract the data to draw the plot**/
  populatePlotData() {}

  /** @description manipulation of the svg**/
  drawPlot() {
    this.dataSelectionModeEnable = false;

    // creating drag element
    const drag = d3.drag();
    this.svg.call(drag);

    // Creating the selection area
    const dragGroup = this.svg.append("g").attr("id", "dragGroup");

    const band = dragGroup
      .append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "band")
      .attr("id", "band")
      .style("fill", "none")
      .style("stroke", "blue")
      .style("stroke-width", 1);

    let startPoint = null;

    // Register for drag handlers

    drag.on("start", () => {
      // Set new position of band
      const pos = d3.mouse(document.getElementById("dragGroup"));
      startPoint = new Point(pos[0], pos[1]);
    });

    drag.on("drag", () => {
      this.dataSelectionModeEnable = true; // change the tab for showing selected gene

      const pos = d3.mouse(document.getElementById("dragGroup"));
      const endPoint = new Point(pos[0], pos[1]);

      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);

      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      d3.select(".band").attr(
        "transform",
        "translate(" + minX + "," + minY + ")"
      );

      d3.select(".band").attr("width", width).attr("height", height);
    });

    drag.on("end", () => {
      const pos = d3.mouse(document.getElementById("dragGroup"));
      const endPoint = new Point(pos[0], pos[1]);
      // need to get the points that included in the band
      this.resetSelections();

      // define the points that are within the drag boundary
      this.dragEndPoint = new Point(endPoint.x, endPoint.y);
      this.dragStartPoint = new Point(startPoint.x, startPoint.y);
      this.getSelectedDataSet();
      this.resetSelectionRectangle();
    });
  }

  resetSelectionRectangle() {
    d3.select(".band")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0);
  }
  getSelectedDataSet() {}

  setSelectionStyle(id: string) {}

  removeSelectionStyle(id: string) {}

  resetSelections(): void {
    if (this.selectedDataPointIds) {
      for (const id of this.selectedDataPointIds) {
        this.removeSelectionStyle(id);
      }
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

  abstract redrawPlot();

  clearPlot() {
    if (this.plot) {
      this.plot.selectAll("svg").remove();
    }
  }

  /** @description New Dataset Creation  from selected data points **/
  createDatasetFromSelected() {}

  // Redraw the svg with the changed width of the window
  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    this.redrawPlot();
  }
}
