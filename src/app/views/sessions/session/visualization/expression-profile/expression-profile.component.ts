import { Component, Input, OnChanges, OnDestroy, ViewEncapsulation } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import TSVFile from "../../../../../model/tsv/TSVFile";
import TSVRow from "../../../../../model/tsv/TSVRow";
import { FileResource } from "../../../../../shared/resources/fileresource";
import UtilsService from "../../../../../shared/utilities/utils";
import { VisualizationTSVService } from "../../../../../shared/visualization/visualizationTSV.service";
import { SessionDataService } from "../../session-data.service";
import Point from "../model/point";
import { ExpressionProfileService } from "./expression-profile.service";
import GeneExpression from "./geneexpression";
import Interval from "./interval";
import Line from "./line";
import Rectangle from "./rectangle";

@Component({
  selector: "ch-expression-profile",
  templateUrl: "./expression-profile.component.html",
  styleUrls: ["./expression-profile.component.less"],
  encapsulation: ViewEncapsulation.None,
})
export class ExpressionProfileComponent implements OnChanges, OnDestroy {
  @Input()
  private dataset: Dataset;

  private tsv: TSVFile;
  selectedGeneExpressions: Array<GeneExpression>; // selected gene expressions
  public viewSelectionList: Array<any>;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  constructor(
    private expressionProfileService: ExpressionProfileService,
    private sessionDataService: SessionDataService,
    private visualizationTSVService: VisualizationTSVService,
    private fileResource: FileResource,
    private restErrorService: RestErrorService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");
    setTimeout(() => this.update(), 100);
  }

  update() {
    const datasetName = this.dataset.name;

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }
    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          const parsedTSV = d3.tsvParseRows(result);
          this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
          if (this.visualizationTSVService.containsChipHeaders(this.tsv)) {
            this.drawLineChart(this.tsv);
            this.state = new LoadState(State.Ready);
          } else {
            this.state = new LoadState(
              State.Fail,
              "Only microarray data supported, no columns starting with chip found."
            );
          }
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );

    this.selectedGeneExpressions = [];
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  drawLineChart(tsv: TSVFile) {
    const that = this;
    // Configurate svg and graph-area
    const expressionprofileWidth = document.getElementById("expressionprofile").offsetWidth;
    const margin = { top: 10, right: 0, bottom: 150, left: 40 };
    const size = { width: expressionprofileWidth, height: 600 };
    const graphArea = {
      width: size.width,
      height: size.height - margin.top - margin.bottom,
    };

    // SVG-element
    const drag = d3.drag();

    const profile = d3.select("#expressionprofile");

    profile.select("svg").remove();

    const svg = profile
      .append("svg")
      .attr("width", size.width)
      .attr("height", size.height)
      .attr("id", "svg")
      .style("margin-top", margin.top + "px")
      .call(drag);

    // Custom headers for x-axis
    const firstDataset: any = this.dataset;
    const phenodataDescriptions = _.filter(firstDataset.metadata, (metadata: any) => {
      return metadata.key === "description";
    });

    // Change default headers to values defined in phenodata if description value has been defined
    const headers = _.map(this.visualizationTSVService.getChipHeaders(tsv), (header) => {
      // find if there is a phenodata description matching header and containing a value
      const phenodataHeader: any = _.find(phenodataDescriptions, (item: any) => {
        return item.column === header && item.value !== null;
      });
      return phenodataHeader ? phenodataHeader.value : header;
    });

    // X-axis and scale
    // Calculate points (in pixels) for positioning x-axis points
    const chipRange = _.map(headers, (item, index) => (graphArea.width / headers.length) * index);
    const xScale = d3.scaleOrdinal().range(chipRange).domain(headers);
    // compile error hidden with <any>: Argument of type 'ScaleOrdinal<string, {}>' is not
    // assignable to parameter of type 'AxisScale<string>'.
    const xAxis = d3.axisBottom(<any>xScale).ticks(headers.length);
    svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + margin.left + "," + graphArea.height + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-65 0 0)")
      .style("text-anchor", "end");

    // Linear x-axis to determine selection-rectangle position scaled to tsv-data
    const linearXScale = d3
      .scaleLinear()
      .range([0, graphArea.width - graphArea.width / headers.length])
      .domain([0, headers.length - 1]);

    // Y-axis and scale
    const yScale = d3
      .scaleLinear()
      .range([graphArea.height, 0])
      .domain([
        this.visualizationTSVService.getDomainBoundaries(tsv).min,
        this.visualizationTSVService.getDomainBoundaries(tsv).max,
      ]);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg
      .append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.left + ",0 )")
      .call(yAxis);

    // Paths
    const pathsGroup = svg
      .append("g")
      .attr("id", "pathsGroup")
      .attr("transform", "translate(" + margin.left + ",0)");
    const lineGenerator = d3
      .line()
      .x((d: [number, number], i: number) => parseFloat(xScale(headers[i]).toString()))
      .y((d: any) => yScale(d));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const geneExpressions = this.visualizationTSVService.getGeneExpressions(tsv);
    const orderedExpressionGenes = this.visualizationTSVService.orderBodyByFirstValue(geneExpressions);

    const paths = pathsGroup
      .selectAll(".path")
      .data(orderedExpressionGenes)
      .enter()
      .append("path")
      .attr("class", "path")
      .attr("id", (d: GeneExpression) => "path" + d.id)
      // compile error hidden with <any>: Argument of type 'number[]' is not assignable to parameter of type '[number, number][]'.
      .attr("d", (d: GeneExpression) => lineGenerator(<any>d.values))
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke", (d: any, i: number) => {
        //     There are 20 different colors in colorcategory. Setting same color for each consecutive 5% of lines.
        //     So for 100 lines 5 first lines gets first color in category, next 5 lines get second color and so on.
        const colorIndex = _.floor((i / tsv.body.size()) * 20).toString();
        return color(colorIndex);
      })
      .on("mouseover", (d: any) => {
        that.setSelectionHoverStyle(d.id);
      })
      .on("mouseout", (d: any) => {
        that.removeSelectionHoverStyle(d.id);
      })
      .on("click", (d: GeneExpression) => {
        const id = d.id;
        const isCtrl = UtilsService.isCtrlKey(d3.event);
        const isShift = UtilsService.isShiftKey(d3.event);
        if (isShift) {
          that.addSelections([id]);
        } else if (isCtrl) {
          that.toggleSelections([id.toString()]);
        } else {
          that.resetSelections();
          that.addSelections([id]);
        }
      });

    // path animation
    // paths.each(function(d: any) { d.totalLength = this.getTotalLength(); })
    //     .attr("stroke-dasharray", function(d:any) { return d.totalLength + " " + d.totalLength; })
    //     .attr("stroke-dashoffset", function(d:any) { return d.totalLength; })
    //     .transition()
    //     .duration(2000)
    //     .ease('linear')
    //     .attr('stroke-dashoffset', 0);

    // Dragging
    const dragGroup = svg
      .append("g")
      .attr("id", "dragGroup")
      .attr("transform", "translate(" + margin.left + ",0)");

    // Create selection rectangle
    const band = dragGroup
      .append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "band")
      .attr("id", "band");

    const bandPos = [-1, -1];
    let startPoint = new Point(-1, -1); // startpoint for dragging

    // Register drag handlers
    drag.on("drag", () => {
      const pos = d3.mouse(document.getElementById("dragGroup"));
      const endPoint = new Point(pos[0], pos[1]);

      if (endPoint.x < startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + endPoint.x + "," + startPoint.y + ")");
      }
      if (endPoint.y < startPoint.y) {
        d3.select(".band").attr("transform", "translate(" + endPoint.x + "," + endPoint.y + ")");
      }
      if (endPoint.y < startPoint.y && endPoint.x > startPoint.x) {
        d3.select(".band").attr("transform", "translate(" + startPoint.x + "," + endPoint.y + ")");
      }

      // set new position of band when user initializes drag
      if (startPoint.x === -1) {
        startPoint = new Point(endPoint.x, endPoint.y);
        d3.select(".band").attr("transform", "translate(" + startPoint.x + "," + startPoint.y + ")");
      }

      d3.select(".band")
        .transition()
        .duration(1)
        .attr("width", Math.abs(startPoint.x - endPoint.x))
        .attr("height", Math.abs(startPoint.y - endPoint.y));
    });

    drag.on("end", () => {
      const pos = d3.mouse(document.getElementById("dragGroup"));
      const endPoint = new Point(pos[0], pos[1]);

      if (startPoint.x !== -1 && startPoint.y !== -1 && startPoint.x !== endPoint.x && startPoint.y !== endPoint.y) {
        this.resetSelections();
        d3.selectAll(".path").attr("stroke-width", 1);
        const p1 = new Point(endPoint.x, endPoint.y);
        const p2 = new Point(startPoint.x, startPoint.y);

        const intervalIndexes = that.expressionProfileService.getCrossingIntervals(
          endPoint,
          startPoint,
          linearXScale,
          tsv
        );
        const intervals: Array<Interval> = [];

        // create intervals
        for (let chipValueIndex = intervalIndexes.start; chipValueIndex < intervalIndexes.end; chipValueIndex++) {
          const lines = that.expressionProfileService.createLines(tsv, chipValueIndex, linearXScale, yScale);
          const intervalStartIndex = chipValueIndex;

          const rectangle = new Rectangle(endPoint.x, endPoint.y, startPoint.x, startPoint.y);
          intervals.push(new Interval(intervalStartIndex, lines, rectangle));
        }

        let ids: Array<string> = []; // path ids found in each interval (not unique list)
        for (const interval of intervals) {
          const intersectingLines = _.filter(interval.lines, (line: Line) => {
            return that.expressionProfileService.isIntersecting(line, interval.rectangle);
          });

          // Line ids intersecting with selection as an array
          ids = ids.concat(_.map(intersectingLines, (line: Line) => line.lineId));
        }

        this.resetSelections();
        this.addSelections(_.uniq(ids));

        // remove duplicate ids
        resetSelectionRectangle();
      }
    });

    function resetSelectionRectangle() {
      startPoint = new Point(-1, -1);
      d3.select(".band").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);
    }
  }

  createNewDataset() {
    const selectedGeneExpressionIds = this.getSelectionIds();
    const tsvData = this.tsv.getRawDataByRowIds(selectedGeneExpressionIds);
    const data = d3.tsvFormatRows(tsvData);
    this.sessionDataService
      .createDerivedDataset("dataset.tsv", [this.dataset.datasetId], "Expression profile", data)
      .subscribe(null);
  }

  getSelectionIds(): Array<string> {
    return this.selectedGeneExpressions.map((expression: GeneExpression) => expression.id);
  }

  resetSelections(): void {
    this.removeSelections(this.getSelectionIds());
    this.selectedGeneExpressions.length = 0;
  }

  removeSelections(ids: Array<string>): void {
    for (const id of ids) {
      this.removeSelectionStyle(id);
    }

    const selectedGeneIds = _.filter(this.getSelectionIds(), (selectionId) => !_.includes(ids, selectionId));
    this.selectedGeneExpressions = _.map(selectedGeneIds, (id) =>
      this.visualizationTSVService.getGeneExpression(this.tsv, id)
    );
  }

  addSelections(ids: Array<string>) {
    const selectionIds = this.getSelectionIds();
    const missingSelectionIds = _.difference(ids, selectionIds);
    const missingGeneExpressions = _.map(missingSelectionIds, (id) =>
      this.visualizationTSVService.getGeneExpression(this.tsv, id)
    );
    this.selectedGeneExpressions = this.selectedGeneExpressions.concat(missingGeneExpressions);
    missingSelectionIds.forEach((id) => {
      this.setSelectionStyle(id);
    });
    this.setViewSelectionList();
  }

  toggleSelections(ids: Array<string>) {
    const selectionIds = this.getSelectionIds();
    const selectionIdsToAdd = _.difference(ids, selectionIds);
    const selectionIdsToRemove = _.intersection(ids, selectionIds);
    this.addSelections(selectionIdsToAdd);
    this.removeSelections(selectionIdsToRemove);
  }

  setSelectionStyle(id: string) {
    d3.select("#path" + id).classed("selected", true);
  }

  removeSelectionStyle(id: string) {
    d3.select("#path" + id).classed("selected", false);
  }

  setSelectionHoverStyle(id: string) {
    d3.select("#path" + id).classed("pathover", true);
  }

  removeSelectionHoverStyle(id: string) {
    d3.select("#path" + id).classed("pathover", false);
  }

  setViewSelectionList(): void {
    const rowIds = this.selectedGeneExpressions.map((geneExpression: GeneExpression) => geneExpression.id);
    const rawTSVRows = this.tsv.body.getTSVRows(rowIds);
    const tsvSymbolIndex = this.tsv.getColumnIndex("symbol");
    const tsvIdentifierIndex = this.tsv.getColumnIndex("identifier");
    this.viewSelectionList = rawTSVRows.map((row: TSVRow) => {
      return {
        symbol: row.row[tsvSymbolIndex],
        identifier: row.row[tsvIdentifierIndex],
      };
    });
  }
}
