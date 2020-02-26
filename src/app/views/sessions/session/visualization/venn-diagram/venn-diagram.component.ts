import { Component, Input, OnChanges } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import * as _ from "lodash";
import { forkJoin as observableForkJoin } from "rxjs";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import TSVFile from "../../../../../model/tsv/TSVFile";
import { TsvService } from "../../../../../shared/services/tsv.service";
import UtilsService from "../../../../../shared/utilities/utils";
import { SessionDataService } from "../../session-data.service";
import Circle from "../model/circle";
import Point from "../model/point";
import VennCircle from "./venn-circle";
import VennDiagramSelection from "./venn-diagram-selection";
import VennDiagramText from "./venn-diagram-text";
import VennDiagramUtils from "./venn-diagram-utils";
import { VennDiagramService } from "./venn-diagram.service";

@Component({
  selector: "ch-venn-diagram",
  templateUrl: "./venn-diagram.component.html",
  styleUrls: ["./venn-diagram.component.less"]
})
export class VennDiagramComponent implements OnChanges {
  @Input()
  selectedDatasets: Array<Dataset>;

  files: Array<TSVFile> = [];
  vennCircles: Array<VennCircle>;
  diagramSelection: VennDiagramSelection = new VennDiagramSelection();
  columnKey: string;
  symbolComparingEnabled: boolean;
  identifierComparingEnabled: boolean;

  isEnabled = false;

  constructor(
    private tsvService: TsvService,
    private venndiagramService: VennDiagramService,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService
  ) {}

  ngOnChanges() {
    if (this.isEnabled) {
      this.init();
    }
  }

  init() {
    const datasetIds = this.selectedDatasets.map((dataset: Dataset) => dataset);
    const tsvObservables = datasetIds.map((dataset: Dataset) =>
      this.tsvService.getTSV(this.sessionDataService.getSessionId(), dataset)
    );

    observableForkJoin(tsvObservables).subscribe(
      (resultTSVs: Array<any>) => {
        this.files = _.chain(resultTSVs)
          .map((tsv: any) => d3.tsvParseRows(tsv))
          .map((tsv: Array<Array<string>>, index: number) => {
            return new TSVFile(
              tsv,
              this.selectedDatasets[index].datasetId,
              this.selectedDatasets[index].name
            );
          })
          .value();

        this.symbolComparingEnabled = this.enableComparing("symbol");
        this.identifierComparingEnabled = this.enableComparing("identifier");
        this.columnKey = this.identifierComparingEnabled
          ? "identifier"
          : "symbol";
        this.drawVennDiagram(this.files);
      },
      (error: any) => {
        this.restErrorService.showError("Fetching TSV-files failed", error);
      }
    );
  }

  enable() {
    this.isEnabled = true;
    this.init();
  }

  drawVennDiagram(files: Array<TSVFile>) {
    const visualizationWidth = document.getElementById("visualization")
      .offsetWidth;
    const circleRadius = 125;
    const size = { width: visualizationWidth, height: 500 };
    const visualizationArea = {
      width: size.width,
      height: size.height,
      center: new Point(size.width / 2, size.height / 2)
    };

    this.vennCircles = this.createVennCircles(
      files,
      visualizationArea.center,
      circleRadius
    );
    // color category
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // remove the previous graph, e.g. if a third file was just added
    d3.select("#visualization")
      .select("svg")
      .remove();

    // svg-element
    const svg = d3
      .select("#visualization")
      .append("svg")
      .attr("width", size.width)
      .attr("height", size.height)
      .attr("id", "svg");

    // draw vennCircles
    const circleGroup = svg.append("g").attr("id", "circleGroup");
    circleGroup
      .selectAll(".ellipse")
      .data(this.vennCircles)
      .enter()
      .append("ellipse")
      .attr("rx", (d: VennCircle, i: number) => d.circle.radius)
      .attr("ry", (d: VennCircle, i: number) => d.circle.radius)
      .attr("cx", (d: VennCircle, i: number) => d.circle.center.x)
      .attr("cy", (d: VennCircle, i: number) => d.circle.center.y)
      .attr("opacity", 0.4)
      .attr("fill", (d: VennCircle, i: number) => colors(i.toString()));

    // Add filenames for each venn diagram circles and item counts in each segment
    const circleTextsGroup = svg.append("g").attr("id", "circleTextsGroup");
    const filenameTexts = this.getVennCircleFileNameDescriptor(
      this.vennCircles,
      visualizationArea
    );
    const segmentItemCountTexts = this.venndiagramService.getVennDiagramSegmentTexts(
      this.vennCircles,
      visualizationArea.center,
      this.columnKey
    );

    const circleTexts = [...filenameTexts, ...segmentItemCountTexts];
    circleTextsGroup
      .selectAll(".text")
      .data(circleTexts)
      .enter()
      .append("text")
      .attr("x", d => d.position.x)
      .attr("y", d => d.position.y)
      .text(d => d.text);

    // selection group
    const selectionGroup = svg.append("g").attr("id", "vennselections");
    circleGroup.on("click", () => {
      const isShift = UtilsService.isShiftKey(d3.event);
      if (!isShift) {
        selectionGroup.selectAll("*").remove();
      }

      const coords = d3.mouse(document.getElementById("circleGroup"));
      const mouseposition = new Point(coords[0], coords[1]);
      const selectionVennCircles = VennDiagramUtils.getCirclesByPosition(
        this.vennCircles,
        mouseposition
      );
      if (selectionVennCircles.length >= 1) {
        const selectionDescriptor = this.getSelectionDescriptor(
          this.vennCircles,
          selectionVennCircles,
          circleRadius,
          visualizationArea
        );

        selectionGroup
          .append("path")
          .attr("class", "vennselection")
          .attr("d", selectionDescriptor)
          .attr("fill", "grey")
          .attr("opacity", 0.7)
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        const values = this.venndiagramService.getDataIntersection(
          selectionVennCircles,
          this.vennCircles,
          this.columnKey
        );
        const datasetIds = selectionVennCircles.map(
          (vennCircle: VennCircle) => vennCircle.datasetId
        );
        if (!isShift) {
          this.diagramSelection.clearSelection();
        }
        this.diagramSelection.addSelection(datasetIds, values);
      }
    });
  }

  getVennCircleFileNameDescriptor(
    vennCircles: Array<VennCircle>,
    visualizationArea: any
  ): Array<any> {
    return vennCircles.map((vennCircle: VennCircle) => {
      return new VennDiagramText(
        vennCircle.filename,
        this.venndiagramService.getVennCircleFilenamePoint(
          vennCircle,
          visualizationArea.center
        )
      );
    });
  }

  getSelectionDescriptor(
    allVennCircles: Array<VennCircle>,
    selectionVennCircles: Array<VennCircle>,
    circleRadius,
    visualizationArea
  ) {
    const selectionCircles = selectionVennCircles.map(
      (vennCircle: VennCircle) => vennCircle.circle
    );
    const circles = allVennCircles.map(
      (vennCircle: VennCircle) => vennCircle.circle
    );
    return this.venndiagramService.getSelectionDescriptor(
      circles,
      selectionCircles,
      circleRadius,
      visualizationArea.center
    );
  }

  resetSelection(): void {
    this.diagramSelection.clearSelection();
  }

  createNewDataset(): void {
    const parentDatasetIds = this.selectedDatasets.map(
      (dataset: Dataset) => dataset.datasetId
    );

    const data = this.venndiagramService.generateNewDatasetTSV(
      this.files,
      this.diagramSelection,
      this.columnKey
    );

    const tsvData = d3.tsvFormatRows(data);
    this.sessionDataService
      .createDerivedDataset(
        "dataset.tsv",
        parentDatasetIds,
        "Venn-Diagram",
        tsvData
      )
      .subscribe(null, err =>
        this.restErrorService.showError("Create file failed", err)
      );
  }

  createVennCircles(
    files: Array<TSVFile>,
    visualizationAreaCenter: Point,
    radius: number
  ): Array<VennCircle> {
    const circleCenters = this.venndiagramService.getCircleCenterPoints(
      files.length,
      visualizationAreaCenter,
      radius
    );
    return files.map(
      (file: TSVFile, index: number) =>
        new VennCircle(
          file.datasetId,
          file.filename,
          file.getColumnDataByHeaderKeys(["symbol", "identifier"]),
          new Circle(circleCenters[index], radius)
        )
    );
  }

  enableComparing(key: string): boolean {
    return _.every(this.files, (file: TSVFile) =>
      _.includes(file.headers.headers, key)
    );
  }

  compareIntersectionBy(str: string): void {
    this.columnKey = str;
    this.resetSelection();
  }
}
