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
import { pointerPosition } from "./plot.service";
import { SelectionRow } from "../../views/sessions/session/visualization/model/selectionRow";
import { FileResource } from "../resources/fileresource";
import UtilsService from "../utilities/utils";
import { VisualizationTSVService } from "./visualizationTSV.service";

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
  // symbols and identifiers of the selected rows, shown in the selection list
  viewSelectionList: Array<SelectionRow> = [];
  // files without a symbol column show the identifier column only
  showSymbolColumn = false;

  svgPadding = 50;
  protected fileResource: FileResource;
  protected sessionDataService: SessionDataService;
  protected visualizationTSVService: VisualizationTSVService;
  private restErrorService: RestErrorService;
  private zone: NgZone;

  protected unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  // Redraws the plot when its container changes width, see observePlotResize()
  private resizeObserver: ResizeObserver;
  private lastPlotWidth: number;

  constructor(
    fileResource: FileResource,
    sessionDataService: SessionDataService,
    visualizationTSVService: VisualizationTSVService,
  ) {
    this.fileResource = fileResource;
    this.sessionDataService = sessionDataService;
    this.visualizationTSVService = visualizationTSVService;
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
    this.viewSelectionList = [];

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

    // A click selects a single data point, so allow a little movement before a
    // gesture counts as a rectangle selection. Without this d3 would swallow the
    // click of any mouse that moved even one pixel, its clickDistance being 0.
    const clickDistance = 4;
    const drag = d3.drag().clickDistance(clickDistance);

    // where the press of the gesture landed, and whether the drag behaviour took
    // the gesture, see the click handler below
    let pressPoint: Point = null;
    let gestureStarted = false;

    // The preventDefault() keeps a drag from extending a text selection that
    // starts somewhere else on the page, which scrolls the page instead of
    // drawing the selection rectangle. d3 blocks selectstart, but a modifier
    // click that extends an existing selection never fires it, and d3 doesn't
    // preventDefault the mousedown itself. This has to be registered before the
    // drag behaviour, which stops immediate propagation of mousedown.
    this.svg.on("mousedown", (event) => {
      event.preventDefault();
      pressPoint = pointerPosition(event, document.getElementById("dragGroup"));
      gestureStarted = false;
    });

    // The drag behaviour ignores a gesture that is made with ctrl held, so such a
    // click never reaches the drag handler, which is the only place that selects a
    // data point. Handle the clicks it declined here instead.
    //
    // The gesture is left filtered, because a ctrl press opens the context menu
    // on macOS, and the menu takes the mouseup that would end the gesture: d3
    // would keep the capturing mousemove listener it registers on the window,
    // which stops the propagation of every mousemove of the app, and the block it
    // puts on selecting text, until the next press on the plot.
    //
    // A gesture of its own tells that the drag handler has the press, whatever
    // the modifiers were, so nothing is selected twice. Reading the modifiers
    // instead would miss a modifier that was pressed or released mid-click, which
    // the drag behaviour decided on at the press: a cmd click that ends with ctrl
    // held would be toggled here a second time, back to where it started.
    this.svg.on("click", (event) => {
      if (gestureStarted || pressPoint == null) {
        return;
      }
      const releasePoint = pointerPosition(event, document.getElementById("dragGroup"));
      const dx = releasePoint.x - pressPoint.x;
      const dy = releasePoint.y - pressPoint.y;
      if (dx * dx + dy * dy > clickDistance * clickDistance) {
        // a drag, which draws no rectangle when the behaviour declined it, so it
        // selects nothing rather than a data point that happens to be near its end
        return;
      }
      const nearbyId = this.getDataPointNear(pressPoint) ?? this.getDataPointNear(releasePoint);
      if (nearbyId != null) {
        // a ctrl click on an empty area toggles nothing, like a cmd click there
        this.selectDataPoint(event, nearbyId);
      }
    });

    this.svg.call(drag);

    // Creating the selection area
    const dragGroup = this.svg.append("g").attr("id", "dragGroup");

    dragGroup
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
      gestureStarted = true;

      // Set new position of band
      startPoint = pointerPosition(event, document.getElementById("dragGroup"));
    });

    drag.on("drag", (event) => {
      this.dataSelectionModeEnable = true; // change the tab for showing selected gene

      const endPoint = pointerPosition(event, document.getElementById("dragGroup"));

      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);

      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      d3.select(".band").attr("transform", "translate(" + minX + "," + minY + ")");

      d3.select(".band").attr("width", width).attr("height", height);
    });

    drag.on("end", (event) => {
      const endPoint = pointerPosition(event, document.getElementById("dragGroup"));
      const sourceEvent = event.sourceEvent ?? event;
      const isShift = UtilsService.isShiftKey(sourceEvent);

      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      if (dx * dx + dy * dy <= clickDistance * clickDistance) {
        // A click, not a rectangle selection. This handles every click, whether
        // it hit a data point or not, because the data points cannot handle their
        // own: the browser dispatches the click on the closest common ancestor of
        // the elements the press and the release landed on, which is the svg as
        // soon as the mouse moved off a data point, even by less than the click
        // distance.
        //
        // The data points are only a couple of pixels wide, so a click that
        // narrowly misses one still selects it. Look around both ends of the
        // gesture, preferring the press: a click that starts on a data point means
        // that data point, however the mouse drifted before the release, and the
        // drift can take the release further away than the tolerance.
        //
        // The release is worth a look of its own only when it is somewhere else.
        // A click of a mouse that didn't move at all is the common case, and both
        // ends of it would give the same answer.
        const moved = dx !== 0 || dy !== 0;
        const nearbyId = this.getDataPointNear(startPoint) ?? (moved ? this.getDataPointNear(endPoint) : null);
        if (nearbyId != null) {
          this.selectDataPoint(sourceEvent, nearbyId);
        } else if (!isShift && !UtilsService.isCtrlKey(sourceEvent)) {
          // a click on an empty area clears the selection, but shift and cmd
          // clicks add to or toggle it, so they must not clear
          this.resetSelections();
        }
        this.resetSelectionRectangle();
        return;
      }

      // define the points that are within the drag boundary
      this.dragEndPoint = new Point(endPoint.x, endPoint.y);
      this.dragStartPoint = new Point(startPoint.x, startPoint.y);

      // Shift adds the data points in the rectangle to the current selection and
      // cmd toggles them, otherwise the rectangle replaces the selection. Only
      // cmd, because d3 doesn't start a drag gesture when ctrl is held.
      //
      // The lookups use sets, because a rectangle can cover every data point of
      // the file and searching arrays of that size for each of them takes seconds.
      const inRectangle = this.getDataPointsInDragRectangle();
      const selected = this.selectedDataPointIds ?? [];
      const selectedIds = new Set(selected);
      const notSelectedYet = inRectangle.filter((id) => !selectedIds.has(id));
      let ids: Array<string>;
      if (isShift) {
        ids = selected.concat(notSelectedYet);
      } else if (UtilsService.isCtrlKey(sourceEvent)) {
        const rectangleIds = new Set(inRectangle);
        ids = selected.filter((id) => !rectangleIds.has(id)).concat(notSelectedYet);
      } else {
        ids = inRectangle;
      }
      this.showSelection(ids);
      this.resetSelectionRectangle();
    });
  }

  resetSelectionRectangle() {
    d3.select(".band").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);
  }
  /** @description ids of the data points inside the drag rectangle* */
  abstract getDataPointsInDragRectangle(): Array<string>;

  setSelectionStyle(_id: string) {}

  removeSelectionStyle(_id: string) {}

  resetSelections(): void {
    if (this.selectedDataPointIds) {
      for (const id of this.selectedDataPointIds) {
        this.removeSelectionStyle(id);
      }
    }
    // also clear the ids, otherwise redrawPlot() re-applies the highlight of a
    // selection that was cleared without selecting anything new
    this.selectedDataPointIds = [];
    this.selectedDataRows = [];
    this.viewSelectionList = [];
  }

  /** @description update the selection list shown next to the plot* */
  setViewSelectionList(): void {
    this.showSymbolColumn = this.visualizationTSVService.containsSymbolColumn(this.tsv);
    // from the rows of showSelection(), which has just looked them up
    this.viewSelectionList = this.visualizationTSVService.getSelectionRowsFromTSVRows(this.tsv, this.selectedDataRows);
  }

  /**
   * @description select a single data point, e.g. when it is clicked
   *
   * Shift adds to the selection and ctrl or cmd toggles, like in the expression
   * profile.
   */
  selectDataPoint(event, id: string): void {
    const selected = this.selectedDataPointIds ?? [];
    let ids: Array<string>;
    if (UtilsService.isShiftKey(event)) {
      ids = selected.includes(id) ? selected : selected.concat(id);
    } else if (UtilsService.isCtrlKey(event)) {
      ids = selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : selected.concat(id);
    } else {
      ids = [id];
    }
    this.showSelection(ids);
  }

  /**
   * @description id of the data point closest to the given point, or null if none is close
   *
   * Hit tests against the drawn circles rather than the plot data, so that it
   * needs to know neither the scales nor how a plot places its data points.
   */
  protected getDataPointNear(point: Point): string {
    const tolerance = 5;
    let closestId: string = null;
    let closestDistance = tolerance * tolerance;
    this.svg
      .selectAll(".dot")
      .nodes()
      .forEach((dot) => {
        const dx = Number(dot.getAttribute("cx")) - point.x;
        const dy = Number(dot.getAttribute("cy")) - point.y;
        const distance = dx * dx + dy * dy;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = (d3.select(dot).datum() as PlotData).id;
        }
      });
    return closestId;
  }

  /** @description show the given data points as the current selection* */
  protected showSelection(ids: Array<string>): void {
    (this.selectedDataPointIds ?? []).forEach((id) => this.removeSelectionStyle(id));
    this.selectedDataPointIds = ids;
    this.selectedDataRows = this.tsv.body.getTSVRows(ids);
    this.setViewSelectionList();
    ids.forEach((id) => this.setSelectionStyle(id));
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
