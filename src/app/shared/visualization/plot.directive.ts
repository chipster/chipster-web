// Super class for scatterplot and volcanoplot

import { Directive, Input, NgZone, OnChanges, OnDestroy } from "@angular/core";
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
  private zone: NgZone;

  protected unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  // Redraws the plot when its container changes width, see observePlotResize()
  private resizeObserver: ResizeObserver;
  private lastPlotWidth: number;

  constructor(fileResource: FileResource, sessionDataService: SessionDataService) {
    this.fileResource = fileResource;
    this.sessionDataService = sessionDataService;
    this.restErrorService = AppInjector.get(RestErrorService);
    this.zone = AppInjector.get(NgZone);
  }

  ngOnChanges() {
    this.state = new LoadState(State.Loading, "Loading data...");
    setTimeout(() => this.show(false), 100);
  }

  show(showMore: boolean) {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);

    this.clearPlot();

    // clear any previous selection so it isn't re-applied to a new dataset
    this.selectedDataPointIds = undefined;
    this.selectedDataRows = [];

    // reset the cached width so the resize observer redraws the new dataset
    // even when the container returns to a width it had for a previous one
    this.lastPlotWidth = undefined;

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
          this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
          if (this.tsv.body.size() > rowLimit) {
            if (showMore) {
              this.state = new LoadState(
                State.Fail,
                "Plot visualization is not allowed for TSV files with more than " + rowLimit + " data points",
              );
            } else {
              this.state = new LoadState(
                State.TooLarge,
                "Plot visualization may be slow for TSV files with more than " + rowLimit + " data points",
                "Show anyway",
              );
            }
          } else {
            this.checkTSVHeaders(); // will set this.state
          }
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        },
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  /** @description To check whether the file has the required column headers to create the visualization* */
  checkTSVHeaders() {}
  /** @description Extract the data to draw the plot* */
  populatePlotData() {}

  /** @description manipulation of the svg* */
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

    drag.on("start", (event) => {
      // Set new position of band
      const pos = d3.pointer(event, document.getElementById("dragGroup"));
      startPoint = new Point(pos[0], pos[1]);
    });

    drag.on("drag", (event) => {
      this.dataSelectionModeEnable = true; // change the tab for showing selected gene

      const pos = d3.pointer(event, document.getElementById("dragGroup"));

      const endPoint = new Point(pos[0], pos[1]);

      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);

      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      d3.select(".band").attr("transform", "translate(" + minX + "," + minY + ")");

      d3.select(".band").attr("width", width).attr("height", height);
    });

    drag.on("end", (event) => {
      const pos = d3.pointer(event, document.getElementById("dragGroup"));
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
    d3.select(".band").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);
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

  /** @description New Dataset Creation  from selected data points * */
  createDatasetFromSelected() {}

  /**
   * Redraw the plot whenever its container changes width.
   *
   * The plot is drawn into a tab that ngbNav creates lazily. When the tab
   * becomes visible the container doesn't necessarily have its final width
   * yet, so the first draw can end up with a zero/wrong width and an empty
   * plot. Observing the container redraws the plot once it gets its real
   * width, and also takes care of redrawing on window resize.
   *
   * Only width changes trigger a redraw: the plot height is fixed, so
   * height-only changes (e.g. the selection list growing the panel) must
   * not redraw, otherwise the current selection highlight would be lost.
   *
   * Safe to call repeatedly; the observer is only created once.
   */
  protected observePlotResize(element: Element) {
    if (!element || this.resizeObserver) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width !== this.lastPlotWidth && this.tsv && this.selectedXAxisHeader) {
        this.lastPlotWidth = width;
        // ResizeObserver fires outside Angular's zone; redraw inside it so the
        // d3 drag handlers are re-registered in the zone (otherwise selecting
        // would not trigger change detection) and bound state stays in sync.
        this.zone.run(() => this.redrawPlot());
      }
    });
    this.resizeObserver.observe(element);
  }
}
