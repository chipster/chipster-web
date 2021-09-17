import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { Store } from "@ngrx/store";
import { Dataset, Job, Module } from "chipster-js-common";
import * as d3 from "d3";
import * as d3ContextMenu from "d3-context-menu";
import * as _ from "lodash";
import { Observable, Subscription } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { NativeElementService } from "../../../../../shared/services/native-element.service";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import { SettingsService } from "../../../../../shared/services/settings.service";
import UtilsService from "../../../../../shared/utilities/utils";
import { DatasetService } from "../../dataset.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { DatasetModalService } from "../../selectiondetails/datasetmodal.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { VisualizationEventService } from "../../visualization/visualization-event.service";
import { DatasetNodeToolTip } from "./data-node-tooltip";
import { DatasetNode } from "./dataset-node";
import { Link } from "./link";
import Node from "./node";
import { WorkflowGraphService } from "./workflow-graph.service";

@Component({
  selector: "ch-workflow-graph",
  templateUrl: "./workflow-graph.component.html",
  styleUrls: ["./workflow-graph.component.less"],
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowGraphComponent implements OnInit, OnChanges, OnDestroy {
  svg: d3.Selection<SVGSVGElement, {}, HTMLElement, {}>;
  @Input()
  datasetsMap: Map<string, Dataset>;
  @Input()
  jobsMap: Map<string, Job>;
  @Input()
  modulesMap: Map<string, Module>;
  @Input()
  datasetSearch: string;
  @Input()
  defaultScale: number;
  @Input()
  enabled: boolean;
  @Input()
  sessionData: SessionData;

  private zoomScale: number;
  private zoomMin = 0.2;
  private zoomMax = 2;
  private zoomStepFactor = 0.2;

  private zoom;
  private isContextMenuOpen = false;
  private showDatasetSelectionTooltip = false;

  // private readonly primaryColor = "#007bff"; // bootstap primary
  private readonly primaryColor = "#006fe6"; // bootstrap primary darken 5%

  constructor(
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private pipeService: PipeService,
    private workflowGraphService: WorkflowGraphService,
    private selectionHandlerService: SelectionHandlerService,
    private store: Store<any>,
    // private store: Store<Dataset[]>,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private nativeElementService: NativeElementService,
    private restErrorService: RestErrorService,
    private errorService: ErrorService,
    private settingService: SettingsService,
    private datasetService: DatasetService,
    private visualizationEventService: VisualizationEventService,
    private getSessionDataService: GetSessionDataService
  ) {}

  // actually selected datasets
  selectedDatasets: Array<Dataset>;

  // Streams for selected datasets and selectedJobs
  selectedDatasets$: Observable<Array<Dataset>>;

  // var shiftKey, ctrlKey;
  scrollerDiv: d3.Selection<HTMLDivElement, {}, HTMLElement, {}>;
  zoomGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  toolTipDiv: d3.Selection<HTMLDivElement, {}, HTMLElement, {}>;

  d3DatasetNodesGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3PhenodataNodesGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3LinksGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3LinksDefsGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3LabelsGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3PhenodataLabelsGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3PhenodataWarningsGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3PhenodataLinksGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3SelectionRectGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
  d3ZoomBackgroundGroup: d3.Selection<SVGGElement, {}, HTMLElement, {}>;

  d3Links: d3.Selection<SVGLineElement, Link, SVGGElement, {}>;
  d3PhenodataLinks: d3.Selection<SVGLineElement, DatasetNode, SVGGElement, {}>;
  d3Labels: d3.Selection<SVGTextElement, DatasetNode, SVGGElement, {}>;
  d3PhenodataLabels: d3.Selection<SVGTextElement, DatasetNode, SVGGElement, {}>;
  d3PhenodataWarnings: d3.Selection<SVGTextElement, DatasetNode, SVGGElement, {}>;
  d3DatasetNodes: d3.Selection<SVGRectElement, DatasetNode, SVGGElement, {}>;
  d3PhenodataNodes: d3.Selection<SVGRectElement, DatasetNode, SVGGElement, {}>;

  nodeWidth: number = this.workflowGraphService.nodeWidth;
  nodeHeight: number = this.workflowGraphService.nodeHeight;
  phenodataRadius = this.workflowGraphService.phenodataRadius;
  phenodataMargin = this.workflowGraphService.phenodataMargin;
  xMargin = this.workflowGraphService.xMargin;

  fontSize = 14;
  nodeRadius = 12;
  width: number;
  height: number;

  datasetNodes: Array<DatasetNode>;
  phenodataNodes: Array<DatasetNode>;
  links: Array<Link>;
  filter: Map<string, Dataset>;
  datasetTooltip: d3.Selection<HTMLDivElement, {}, HTMLElement, {}>;
  datasetTooltipTriangle: d3.Selection<HTMLDivElement, {}, HTMLElement, {}>;

  datasetToolTipArray: Array<DatasetNodeToolTip> = [];

  dragStarted: boolean;

  searchEnabled = false;
  selectionEnabled = false;

  selectionRect: any;

  renameMenuItem: any;
  convertMenuItem: any;
  deleteMenuItem: any;
  exportMenuItem: any;
  historyMenuItem: any;
  groupsMenuItem: any;
  selectChildrenMenuItem: any;
  dividerMenuItem: any;

  subscriptions: Array<Subscription> = [];

  static getOpacity(isVisible: boolean): number {
    if (isVisible) {
      return 1.0;
    }
    return 0.25;
  }

  static getToolTipOpacity(isVisible: boolean): number {
    if (isVisible) {
      return 0.75;
    }
    return 0.0;
  }

  ngOnInit(): void {
    this.selectedDatasets$ = this.store.select("selectedDatasets");

    const section = d3.select("#workflowvisualization");
    this.scrollerDiv = section.append("div").classed("scroller-div", true);

    // disable back and forward gestures in Safari
    this.nativeElementService.disableGestures(this.scrollerDiv.node());

    this.svg = this.scrollerDiv.append("svg");
    this.zoomGroup = this.svg.append("g");

    // background for listening background click and drags in dataset coordinates
    this.d3ZoomBackgroundGroup = this.zoomGroup.append("g").classed("zoom-background", true);

    // adding the tooltip div
    this.toolTipDiv = this.scrollerDiv.append("div").classed("dataset-tooltip-div", true);
    // this.toolTipDiv.id = "some_id";

    // order of these appends will determine the drawing order
    this.d3LinksGroup = this.zoomGroup.append("g").attr("class", "link").attr("id", "d3LinksGroup");
    this.d3PhenodataLinksGroup = this.zoomGroup
      .append("g")
      .attr("class", "phenodata link")
      .attr("id", "d3PhenodataLinksGroup");
    this.d3LinksDefsGroup = this.d3LinksGroup.append("defs");
    this.d3DatasetNodesGroup = this.zoomGroup
      .append("g")
      .attr("class", "dataset node")
      .attr("id", "d3DatasetNodesGroup");
    this.d3PhenodataNodesGroup = this.zoomGroup
      .append("g")
      .attr("class", "phenodata")
      .attr("id", "d3PhenodataNodesGroup");
    this.d3LabelsGroup = this.zoomGroup.append("g").attr("class", "label");
    this.d3PhenodataLabelsGroup = this.zoomGroup.append("g").attr("class", "phenodataLabel");
    this.d3PhenodataWarningsGroup = this.zoomGroup.append("g").attr("class", "phenodataWarning");
    this.datasetTooltip = d3
      .select("body")
      .append("div")
      .attr("class", "dataset-tooltip")
      .style("opacity", 0)
      .html("tooltip");
    this.datasetTooltipTriangle = d3
      .select("body")
      .append("div")
      .attr("class", "dataset-tooltip-triangle")
      .style("opacity", 0)
      .html("\u25BC");

    this.d3SelectionRectGroup = this.zoomGroup.append("g").classed("selection-rect", true);

    this.initContextMenuItems();

    // needs to be before applyZoom if enabled is true
    // otherwise datasets is null when calculating scroll stuff
    this.update();

    this.applyZoom(this.defaultScale);

    if (this.enabled) {
      this.subscriptions.push(
        this.sessionEventService.getDatasetStream().subscribe(
          () => {
            this.update();
            this.renderGraph();
            // dataset may have been moved outside of the svg area
            this.updateSvgSize();
          },
          (err) => this.errorService.showError("get dataset events failed", err)
        )
      );

      this.subscriptions.push(
        this.selectedDatasets$.subscribe(
          (datasets: Array<Dataset>) => {
            this.selectedDatasets = datasets;
            this.selectionEnabled = true;
            this.update();
            this.renderGraph();
          },
          (err) => this.errorService.showError("get dataset selections failed", err)
        )
      );
    }

    // subscribe to data Selection tooltip show settings
    this.settingService.showDatasetSelectionTooltip$.subscribe((res: boolean) => {
      this.showDatasetSelectionTooltip = res;
      this.renderGraph();
    });

    //
    this.renderGraph();
    // how to call setScrollLimits() properly after the layout is done?
    // without this async call the scroll limits are initialized incorrectly and the view jumps on the first
    // pan or zoom
    setTimeout(() => {
      // check that the element isn't removed already (e.g. when removing many sessions fast)
      if (document.getElementById("d3DatasetNodesGroup")) {
        this.updateSvgSize();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.zoomGroup) {
      // not yet initialized
      return;
    }

    if ("datasetSearch" in changes) {
      if (this.datasetSearch) {
        const filteredDatasets = this.pipeService.findDataset(
          UtilsService.mapValues(this.datasetsMap),
          this.datasetSearch
        );
        this.filter = UtilsService.arrayToMap(filteredDatasets, "datasetId");
        this.searchEnabled = true;
      } else {
        this.filter = null;
        this.searchEnabled = false;
      }
      this.renderGraph();
    }
  }

  ngOnDestroy(): void {
    this.removeDatasetNodeToolTips();
    this.subscriptions.forEach((subs) => subs.unsubscribe());
    this.subscriptions = [];
  }

  zoomIn(): void {
    this.applyZoom((1 + this.zoomStepFactor) * this.zoomScale);
  }

  zoomOut(): void {
    this.applyZoom((1 - this.zoomStepFactor) * this.zoomScale);
  }

  resetZoomAndScroll(): void {
    // reset zoom
    this.zoomGroup.attr("transform", "translate(0, 0) scale(" + this.defaultScale + ")");
    this.zoomScale = this.defaultScale;

    // reset scrolling
    const scroll = this.scrollerDiv.node();
    scroll.scrollLeft = 0;
    scroll.scrollTop = 0;

    this.updateSvgSize();
    this.onZoomInandOut();
  }

  /**
   * Apply zoom changes
   *
   * Calculate the new zoom scale, check limits and apply the new transformation.
   * The default d3 zoom implementation isn't used, because it uses scroll events.
   *
   * The scrolling position is adjusted to keep the center of the graph stationary
   * when zooming.
   */
  applyZoom(targetScale: number): void {
    // check if it is within limits
    let limitedTargetScale;
    if (targetScale < this.zoomMin) {
      limitedTargetScale = this.zoomMin;
    } else if (targetScale > this.zoomMax) {
      limitedTargetScale = this.zoomMax;
    } else {
      limitedTargetScale = targetScale;
    }

    // check if it is actually changing
    if (this.zoomScale && this.zoomScale === limitedTargetScale) {
      return;
    }
    // zoom
    this.zoomGroup.attr("transform", "translate(0, 0) scale(" + limitedTargetScale + ")");

    this.zoomScale = limitedTargetScale;
    this.onZoomInandOut(); // for managing the dataset search tooltips after zoom
    const oldZoomScale = this.zoomScale;

    // this.enables might be dealing with the scrolling, need to fix something here for find file tooltips

    if (this.enabled) {
      // calculate oldzoom / newZoom factor for adjusting scrolling
      const factor = this.zoomScale / oldZoomScale;

      // adjust scrolling

      // coordinates of the viewport center
      const scroll = this.scrollerDiv.node();
      const centerX = scroll.scrollLeft + scroll.clientWidth / 2;
      const centerY = scroll.scrollTop + scroll.clientHeight / 2;

      // coordinates of the center after zooming
      const newCenterX = centerX * factor;
      const newCenterY = centerY * factor;

      // adjust scrolling to keep the center stationary
      scroll.scrollLeft = newCenterX - scroll.clientWidth / 2;
      scroll.scrollTop = newCenterY - scroll.clientHeight / 2;

      this.updateSvgSize();
    }
  }

  getParentSize(): ClientRect | DOMRect {
    return this.scrollerDiv.node().getBoundingClientRect();
  }

  getContentSize(): Dimension {
    // graph size in graph coordinates
    const width =
      Math.max(
        ...this.datasetNodes.map((d) =>
          this.datasetService.hasOwnPhenodata(d.dataset) ? d.x + this.nodeWidth + this.xMargin : d.x
        )
      ) +
      this.nodeWidth +
      15;
    const height = Math.max(...this.datasetNodes.map((d) => d.y)) + this.nodeHeight + 30;

    // graph size in pixels after the zoom
    const scaledWidth = width * this.zoomScale;
    const scaledHeight = height * this.zoomScale;

    return {
      width: scaledWidth,
      height: scaledHeight,
    };
  }

  getSvgSize(): Dimension {
    const parent = this.getParentSize();
    const content = this.getContentSize();

    // This sets limits for the scrolling.
    // It must be large enough to accommodate all the content, but let it still
    // fill the whole viewport if the content is smaller than the viewport.
    // Otherwise the content is centered.
    const translateWidth = _.max([content.width, parent.width]);
    const translateHeight = _.max([content.height, parent.height]);

    return { width: translateWidth, height: translateHeight };
  }

  /**
   * Update svg size
   *
   * Scrolling is done using the standard CSS overflow feature. When the content
   * changes (datasets added or moved) or the zoom changes, we must adjust the size
   * of the SVG element.
   *
   * This allows us to use the scroll events for actually scrolling and this should work
   * nicely on different devices. Usually d3 would use drag events for scrolling and implements
   * it with svg translates.
   */
  updateSvgSize(): void {
    const size = this.getSvgSize();

    this.svg.attr("width", size.width);
    this.svg.attr("height", size.height);

    this.updateZoomBackgroundSize(size.width / this.zoomScale, size.height / this.zoomScale);
  }

  /**
   *
   * @param width width of the whole view in dataset coordinates
   * @param height height of the whole view in dataset coordinates
   */
  updateZoomBackgroundSize(width, height) {
    this.d3ZoomBackgroundGroup.selectAll("rect").remove();

    // add an invisible rect for listening background events
    this.d3ZoomBackgroundGroup
      .append("rect")
      .attr("id", "background-listener")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "none")
      .attr("fill-opacity", 0)
      .call(
        d3
          .drag()
          .on("drag", () => {
            this.dragBackground(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
          })
          .on("end", () => {
            this.dragBackgroundEnd(d3.event);
          })
      );
  }

  update(): void {
    // layout new datasets or anything from the CLI client
    if (this.enabled) {
      this.workflowGraphService.doAndSaveLayout(Array.from(this.datasetsMap.values()), this.datasetsMap, this.jobsMap);
    } else {
      // preview shouldn't update the data on server
      const layoutedDatasets = this.workflowGraphService.doLayout(
        Array.from(this.datasetsMap.values()),
        this.datasetsMap,
        this.jobsMap
      );
      // update our copy of datasets
      layoutedDatasets.forEach((d) => this.datasetsMap.set(d.datasetId, d));
    }

    const datasetNodes = this.getDatasetNodes(
      this.sessionDataService.getCompleteDatasets(this.datasetsMap),
      this.jobsMap,
      this.modulesMap
    );

    const links = this.getLinks(datasetNodes);

    this.datasetNodes = datasetNodes;
    this.phenodataNodes = datasetNodes.filter((datasetNode) =>
      this.datasetService.hasOwnPhenodata(datasetNode.dataset)
    );
    this.links = links;
  }

  isSelectedDataset(dataset: Dataset): boolean {
    return this.enabled && this.selectionService.isSelectedDatasetById(dataset.datasetId);
  }

  renderPhenodataNodes(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // store the selection of all existing and new elements
    this.d3PhenodataNodes = this.d3PhenodataNodesGroup
      .selectAll<SVGRectElement, {}>("rect")
      .data(this.phenodataNodes, (d: DatasetNode) => d.datasetId);

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3PhenodataNodes
      .enter()
      .append("rect")
      .merge(this.d3PhenodataNodes)
      .attr("x", (d) => this.getPhenodataX(d))
      .attr("y", (d) => this.getPhenodataY(d))
      .attr("id", (d) => "node_" + d.datasetId)
      // .attr("rx", this.nodeRadius)
      // .attr("ry", this.nodeRadius)
      .attr("width", this.nodeHeight)
      .attr("height", this.nodeHeight)
      // stroke and stroke width added
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", "2")
      .attr("pointer-events", "all")
      //  .style("fill", d => d.color)
      .style("fill", (d) => (this.isSelectedDataset(d.dataset) ? this.primaryColor : "white"))
      .attr("stroke", (d) => (this.isSelectedDataset(d.dataset) ? this.primaryColor : d.color))

      .style("opacity", (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)))
      .on("mouseover", function (d) {
        if (!self.selectionService.isSelectedDatasetById(d.dataset.datasetId)) {
          d3.select(this).style("fill", "#e9ecef");
        }
        self.showTooltip(this, d, true);
      })
      .on("mouseout", function () {
        const selection = d3.select(this).node();
        if (!self.selectionService.isSelectedDatasetById(selection.id.split("_")[1])) {
          d3.select(this).style("fill", "white");
        }
        self.hideTooltip();
      })
      .classed("phenodata-node", true);

    this.d3PhenodataNodes.on("click", (d: DatasetNode) => {
      if (self.enabled) {
        self.selectionHandlerService.clearJobSelection();
        if (!UtilsService.isCtrlKey(d3.event)) {
          self.selectionHandlerService.clearDatasetSelection();
          self.selectionHandlerService.toggleDatasetSelection([d.dataset]);
          self.visualizationEventService.phenodataSelected(true);
        }
      }
    });

    this.d3PhenodataNodes.exit().remove();

    // update the scroll limits if datasets were added or removed
    if (!this.d3PhenodataNodes.enter().empty() || !this.d3PhenodataNodes.exit().empty()) {
      this.updateSvgSize();
    }
  }

  renderLabels(): void {
    this.d3Labels = this.d3LabelsGroup
      .selectAll<SVGTextElement, {}>("text")
      .data(this.datasetNodes, (d: DatasetNode) => d.datasetId);

    this.d3Labels
      .enter()
      .append("text")
      .merge(this.d3Labels)
      .text((d: DatasetNode) => UtilsService.getFileExtension(d.name).slice(0, 5))
      .attr("x", (d) => d.x + this.nodeWidth / 2)
      .attr("y", (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4)
      .attr("font-size", (d) => {
        // use smaller font if the file extension is long
        if (UtilsService.getFileExtension(d.name).length <= 4) {
          return this.fontSize + "px";
        }
        return this.fontSize - 2 + "px";
      })
      // .attr("stroke", d => (this.isSelectedDataset(d.dataset) ? "2.0" : "1"))
      .attr("fill", (d) => (this.isSelectedDataset(d.dataset) ? "white" : "black"))
      .attr("font-weight", (d) => (this.isSelectedDataset(d.dataset) ? "600" : "400"))
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)));

    this.d3Labels.exit().remove();
  }

  renderPhenodataLabels(): void {
    this.d3PhenodataLabels = this.d3PhenodataLabelsGroup
      .selectAll<SVGTextElement, {}>("text")
      .data(this.phenodataNodes, (d: DatasetNode) => d.datasetId);

    this.d3PhenodataLabels
      .enter()
      .append("text")
      .merge(this.d3PhenodataLabels)
      .text("P")
      .attr("x", (d) => this.getPhenodataLabelX(d))
      .attr("y", (d) => this.getPhenodataLabelY(d))
      .attr("font-size", this.fontSize + "px")
      .attr("fill", (d) => (this.isSelectedDataset(d.dataset) ? "white" : "black"))
      .attr("font-weight", (d) => (this.isSelectedDataset(d.dataset) ? "600" : "400"))
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)));

    this.d3PhenodataLabels.exit().remove();
  }

  renderPhenodataWarnings(): void {
    this.d3PhenodataWarnings = this.d3PhenodataWarningsGroup
      .selectAll<SVGTextElement, {}>("text")
      .data(this.phenodataNodes, (d: DatasetNode) => d.datasetId);

    this.d3PhenodataWarnings
      .enter()
      .append("text")
      .merge(this.d3PhenodataWarnings)

      // .text((d: any) => "\uf071")
      .text(() => "\uf06a")

      .attr("x", (d) => this.getPhenodataLabelX(d) + 14)
      .attr("y", (d) => this.getPhenodataLabelY(d) + 10)
      .attr("class", "fa")
      .attr("font-size", this.fontSize + 2 + "px")
      .attr("fill", "#ffc107")
      .attr("stroke", "#ffc107")
      .attr("stroke-width", "0")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)))
      .classed("invisible", (d) => this.datasetService.isPhenodataFilled(d.dataset));

    this.d3PhenodataWarnings.exit().remove();
  }

  renderDatasets(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // store the selection of all existing and new elements
    this.d3DatasetNodes = this.d3DatasetNodesGroup
      .selectAll<SVGRectElement, {}>("rect")
      .data(this.datasetNodes, (d: DatasetNode) => d.datasetId);

    // context menu items, custom text for delete when multiple files seleted
    const menu =
      this.selectedDatasets && this.selectedDatasets.length > 1
        ? [
            this.groupsMenuItem,
            this.dividerMenuItem,
            this.selectChildrenMenuItem,
            this.dividerMenuItem,
            { ...this.deleteMenuItem, title: "Delete (" + self.selectedDatasets.length + " files)" },
          ]
        : [
            this.renameMenuItem,
            this.convertMenuItem,
            this.groupsMenuItem,
            this.exportMenuItem,
            this.historyMenuItem,
            this.dividerMenuItem,
            this.selectChildrenMenuItem,
            this.dividerMenuItem,
            this.deleteMenuItem,
          ];

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3DatasetNodes
      .enter()
      .append("rect")
      .merge(this.d3DatasetNodes)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("id", (d) => "node_" + d.datasetId)
      .attr("rx", this.nodeRadius)
      .attr("ry", this.nodeRadius)
      .attr("width", this.nodeWidth)
      .attr("height", this.nodeHeight)
      // stroke and stroke width added
      .attr("stroke", (d) => (this.isSelectedDataset(d.dataset) ? this.primaryColor : d.color))
      .attr("stroke-width", "3")
      .attr("pointer-events", "all")
      .style("fill", (d) => (this.isSelectedDataset(d.dataset) ? this.primaryColor : "white"))
      .style("opacity", (d) =>
        WorkflowGraphComponent.getOpacity(!this.searchEnabled || (this.filter && this.filter.has(d.datasetId)))
      )
      // .classed("selected-dataset", d => this.isSelectedDataset(d.dataset))
      .on(
        "contextmenu",
        d3ContextMenu(menu, {
          onOpen: () => {
            this.isContextMenuOpen = true;
          },
          onClose: () => {
            this.isContextMenuOpen = false;
          },
        })
      )
      .on("mouseover", function (d) {
        if (!self.selectionService.isSelectedDatasetById(d.dataset.datasetId)) {
          d3.select(this).style("fill", "#e9ecef");
        }
        if (self.enabled) {
          d3.select(this).classed("hovering-dataset", true);
          self.showTooltip(this, d, false);
        }
      })
      .on("mouseout", function () {
        const selection = d3.select(this).node();
        if (!self.selectionService.isSelectedDatasetById(selection.id.split("_")[1])) {
          d3.select(this).style("fill", "white");
        }

        if (self.enabled) {
          d3.select(this).classed("hovering-dataset", false);
          self.hideTooltip();
        }
      })
      .on("click", (d) => {
        if (self.enabled) {
          self.selectionHandlerService.clearJobSelection();
          if (!UtilsService.isCtrlKey(d3.event)) {
            self.selectionHandlerService.clearDatasetSelection();
          }
          self.selectionHandlerService.toggleDatasetSelection([d.dataset]);
        }
      })
      .call(
        d3
          .drag()
          .on("drag", (d: DatasetNode) => {
            // don't allow datasets to be moved from the unselected dataset
            if (self.isSelectedDataset(d.dataset)) {
              self.dragStarted = true;
              self.hideTooltip(0);
              self.dragNodes(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
            }
          })
          .on("end", function (d: DatasetNode) {
            // check the flag to differentiate between drag and click events
            if (self.dragStarted) {
              self.dragStarted = false;
              self.dragEnd();
              self.showTooltip(this, d, false, 0);
            }
          })
      );

    this.datasetToolTipArray = [];

    if (self.searchEnabled) {
      const datasetClientRects = this.getDatasetClientRects();
      const svgClientRect = this.svg.node().getBoundingClientRect();

      this.d3DatasetNodes.each(function (d, i) {
        const selection = d3.select(this).node();
        self.createTooltipById(selection, d, i, datasetClientRects, svgClientRect);
      });
    }

    const toolTipClientRects = this.getToolTipBoundingClientRects();

    // Show search Tooltips
    this.d3DatasetNodes.each((d, i) => {
      if (self.searchEnabled) {
        self.showToolTipByIdForSearch(d, i, toolTipClientRects);
      }
    });

    this.d3DatasetNodes.exit().remove();

    // update the scroll limits if datasets were added or removedn
    if (!this.d3DatasetNodes.enter().empty() || !this.d3DatasetNodes.exit().empty()) {
      this.updateSvgSize();
    }
  }

  dragBackground(x: number, dx: number, y: number, dy: number): void {
    if (this.selectionRect == null) {
      this.selectionRect = {
        startX: x - dx,
        startY: y - dy,
      };
    }

    const currentX = x;
    const currentY = y;

    this.selectionRect.minX = Math.min(this.selectionRect.startX, currentX);
    const maxX = Math.max(this.selectionRect.startX, currentX);
    this.selectionRect.width = maxX - this.selectionRect.minX;
    this.selectionRect.minY = Math.min(this.selectionRect.startY, currentY);
    const maxY = Math.max(this.selectionRect.startY, currentY);
    this.selectionRect.height = maxY - this.selectionRect.minY;

    this.d3SelectionRectGroup.select("#selection-rect").remove();

    this.d3SelectionRectGroup
      .append("rect")
      .attr("id", "selection-rect")
      .attr("x", this.selectionRect.minX)
      .attr("y", this.selectionRect.minY)
      .attr("width", this.selectionRect.width)
      .attr("height", this.selectionRect.height)
      .attr("stroke", "black")
      .attr("stroke-width", "1")
      .attr("fill", "none")
      .attr("stroke-dasharray", "4");
  }

  dragBackgroundEnd(event) {
    // if not a simple click event
    if (this.selectionRect) {
      this.d3SelectionRectGroup.select("#selection-rect").remove();

      const selection = [];

      if (UtilsService.isCtrlKey(event.sourceEvent)) {
        selection.push(...this.selectionService.selectedDatasets);
      }

      selection.push(
        ...this.datasetNodes
          .filter((n) =>
            this.workflowGraphService.intersectsNode(
              n.dataset,
              this.selectionRect.minX,
              this.selectionRect.minY,
              this.selectionRect.width,
              this.selectionRect.height
            )
          )
          .map((n) => n.dataset)
      );

      this.selectionHandlerService.setDatasetSelection(selection);

      this.selectionRect = null;
    } else {
      /*
      Listen for background clicks

      Don't do anything if the context menu is open, because then the user clicked just to close
      it. Listen for mousedown events like the context menu. This listener seems to be fired before the
      contextMenu onClose, so the isContextMenuOpen does what it says. Using stopPropagation() etc.
      in the context menu onClose doesn't help also, because this was called earlier.
      */
      if (!this.isContextMenuOpen) {
        this.selectionHandlerService.clearDatasetSelection();
        this.selectionHandlerService.clearJobSelection();
      }
    }
  }

  // Function to describe drag behavior
  // noinspection JSUnusedLocalSymbols
  dragNodes(x: number, dx: number, y: number, dy: number): void {
    const selectedDatasets = this.d3DatasetNodes.filter((d: DatasetNode) =>
      this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
    );

    // make sure the datasets aren't moved to negative coordinates
    const datasetArray = [];
    selectedDatasets.each((d) => datasetArray.push(d));

    const minX = d3.min(datasetArray, (d) => d.x);
    const minY = d3.min(datasetArray, (d) => d.y);

    if (minX + dx < this.workflowGraphService.nodeMinX) {
      dx = -(minX - this.workflowGraphService.nodeMinX);
    }

    if (minY + dy < this.workflowGraphService.nodeMinY) {
      dy = -(minY - this.workflowGraphService.nodeMinY);
    }

    selectedDatasets.attr("x", (d) => (d.x += dx)).attr("y", (d) => (d.y += dy));

    this.d3Labels
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr("x", (d) => d.x + this.nodeWidth / 2)
      .attr("y", (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4);

    this.d3PhenodataNodes
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr("x", (d) => this.getPhenodataX(d))
      .attr("y", (d) => this.getPhenodataY(d));

    this.d3PhenodataLabels
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr("x", (d) => this.getPhenodataLabelX(d))
      .attr("y", (d) => this.getPhenodataLabelY(d));

    this.d3PhenodataWarnings
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr("x", (d) => this.getPhenodataWarningX(d))
      .attr("y", (d) => this.getPhenodataWarningY(d));

    this.d3PhenodataLinks
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr("x1", (d) => this.getPhenodataLinkSourceX(d))
      .attr("y1", (d) => this.getPhenodataLinkY(d))
      .attr("x2", (d) => this.getPhenodataLinkTargetX(d))
      .attr("y2", (d) => this.getPhenodataLinkY(d));

    this.d3Links
      .filter((d: Link) => this.selectionService.isSelectedDatasetById(d.source.dataset.datasetId))
      .attr("x1", (d) => d.source.x + this.nodeWidth / 2)
      .attr("y1", (d) => d.source.y + this.nodeHeight);

    this.d3Links
      .filter((d: Link) =>
        this.isDatasetNode(d.target) ? this.selectionService.isSelectedDatasetById(d.target.dataset.datasetId) : false
      )
      .attr("x2", (d) => d.target.x + this.nodeWidth / 2)
      .attr("y2", (d) => d.target.y);
  }

  renderLinks(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // building the arrows for the link end
    this.d3LinksDefsGroup
      .selectAll("marker")
      .data(["end"])
      .enter()
      .append("marker")
      .attr("id", String)
      .attr("viewBox", "-7 -7 14 14")
      .attr("refX", 6)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0,0 m -7,-7 L 7,0 L -7,7 Z")
      .style("fill", "#555")
      .style("opacity", () => WorkflowGraphComponent.getOpacity(!this.searchEnabled));

    // Define the xy positions of the link
    this.d3Links = this.d3LinksGroup.selectAll<SVGLineElement, {}>("line").data(this.links);

    this.d3Links
      .enter()
      .append("line")
      .merge(this.d3Links)
      .attr("x1", (d) => d.source.x + this.nodeWidth / 2)
      .attr("y1", (d) => d.source.y + this.nodeHeight)
      .attr("x2", (d) => d.target.x + this.nodeWidth / 2)
      .attr("y2", (d) => d.target.y)
      .style("opacity", () => WorkflowGraphComponent.getOpacity(!this.searchEnabled))

      .on("click", (d) => {
        self.selectionHandlerService.setJobSelection([d.target.sourceJob]);
      })
      .on("mouseover", function () {
        if (self.enabled) {
          d3.select(this).classed("hovering-job", true);
        }
      })
      .on("mouseout", function () {
        if (self.enabled) {
          d3.select(this).classed("hovering-job", false);
        }
      })
      .style("marker-end", "url(#end)");

    this.d3Links.exit().remove();
  }

  renderPhenodataLinks(): void {
    // Define the xy positions of the link
    this.d3PhenodataLinks = this.d3PhenodataLinksGroup.selectAll<SVGLineElement, {}>("line").data(this.phenodataNodes);

    this.d3PhenodataLinks
      .enter()
      .append("line")
      .merge(this.d3PhenodataLinks)
      .attr("x1", (d) => this.getPhenodataLinkSourceX(d))
      .attr("y1", (d) => this.getPhenodataLinkY(d))
      .attr("x2", (d) => this.getPhenodataLinkTargetX(d))
      .attr("y2", (d) => this.getPhenodataLinkY(d))
      .style("opacity", () => WorkflowGraphComponent.getOpacity(!this.searchEnabled))
      .style("stroke-dasharray", "3, 3");

    this.d3PhenodataLinks.exit().remove();
  }

  dragEnd(): void {
    // update positions of all selected datasets to the server

    const datasetNodes = [];

    this.d3DatasetNodes
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .each((d) => {
        if (d.dataset) {
          datasetNodes.push(d);
        }
      });

    const originalDatasets = datasetNodes.map((d) => _.cloneDeep(d.dataset));

    // this are SessionData instances. Update those immediately to avoid datasets jumping back and forth
    // when moving many datasets at the same time
    const movedDatasets = datasetNodes.map((d) => {
      d.dataset.x = d.x;
      d.dataset.y = d.y;
      return d.dataset;
    });

    this.sessionDataService.updateDatasets(movedDatasets).subscribe(null, (err) => {
      this.restErrorService.showError("dataset upate error", err);

      // update failed. Restore the original positions
      originalDatasets.forEach((d) => this.sessionData.datasetsMap.set(d.datasetId, d));
      this.update();
      this.renderGraph();
    });

    // update scroll limits if datasets were moved
    this.updateSvgSize();
  }

  renderGraph(): void {
    // before rendering the graph, remove the previously added tooltip divs
    this.removeDatasetNodeToolTips();
    this.renderLinks();
    this.renderDatasets();
    this.renderPhenodataNodes();
    this.renderPhenodataLabels();
    this.renderPhenodataLinks();
    this.renderPhenodataWarnings();
    this.renderLabels();
  }

  getDatasetNodes(
    datasetsMap: Map<string, Dataset>,
    jobsMap: Map<string, Job>,
    modulesMap: Map<string, Module>
  ): DatasetNode[] {
    const datasetNodes: DatasetNode[] = [];
    datasetsMap.forEach((dataset: Dataset) => {
      let color = "gray";
      let sourceJob = null;

      if (dataset.sourceJob) {
        if (jobsMap.has(dataset.sourceJob)) {
          sourceJob = jobsMap.get(dataset.sourceJob);

          const module = modulesMap.get(sourceJob.module);
          if (module) {
            const category = module.categoriesMap.get(sourceJob.toolCategory);
            if (category) {
              color = category.color;
            } else {
              // log.info('dataset\'s ' + dataset.name + ' category ' + sourceJob.toolCategory + ' not found')
            }
          } else {
            // log.info('dataset\'s ' + dataset.name + ' module ' + sourceJob.module + ' not found')
          }
        } else {
          // log.info("source job of dataset " + dataset.name + " not found");
        }
      } else {
        // log.info('dataset source job ' +  dataset.name + ' is null');
      }

      // when opening a session file, datasets may be without names for some time
      const name = dataset.name ? dataset.name : "";

      datasetNodes.push({
        x: dataset.x,
        y: dataset.y,
        name,
        extension: UtilsService.getFileExtension(name),
        source: null,
        target: null,
        sourceJob,
        color,
        dataset,
        datasetId: dataset.datasetId,
        created: dataset.created,
      } as DatasetNode);
    });

    return datasetNodes;
  }

  getLinks(nodes: Node[]): Link[] {
    const links: Link[] = [];

    // map for searching source
    const datasetNodesMap = new Map();
    nodes.forEach((node: DatasetNode) => {
      if (node.dataset) {
        datasetNodesMap.set(node.dataset.datasetId, node);
      }
    });

    nodes.forEach((targetNode: Node) => {
      if (targetNode.sourceJob) {
        const sourceJob = targetNode.sourceJob;
        // iterate over the inputs of the source job
        sourceJob.inputs.forEach((input) => {
          const sourceNode = datasetNodesMap.get(input.datasetId);
          if (sourceNode && targetNode) {
            links.push({
              source: sourceNode,
              target: targetNode,
            } as Link);
          } else {
            // log.info("source node not found", sourceNode);
          }
        });
        if (sourceJob.inputs.length === 0) {
          // log.info('source job doesn\'t have inputs', sourceJob);
        }
      } else {
        // log.info("no source job for ", targetNode);
      }
    });

    return links;
  }

  showTooltip(element: Element, dataset: DatasetNode, isPhenodatanode: boolean, delay = 200): void {
    const datasetLeft = element.getBoundingClientRect().left;
    const datasetTop = element.getBoundingClientRect().top;
    const datasetWidth = element.getBoundingClientRect().width;
    const tooltipHeight = this.datasetTooltip.node().getBoundingClientRect().height;
    const triangleHeight = this.datasetTooltipTriangle.node().getBoundingClientRect().height;
    const triangleWidth = this.datasetTooltipTriangle.node().getBoundingClientRect().width;

    this.datasetTooltip.transition().duration(delay).style("opacity", 0.9);

    if (dataset && !isPhenodatanode) {
      this.datasetTooltip.html(dataset.name);
    }

    if (isPhenodatanode) {
      this.datasetTooltip.html("phenodata" + "-" + dataset.name);
    }
    this.datasetTooltip
      .style("left", datasetLeft - 5 + "px")
      .style("top", datasetTop - tooltipHeight - triangleHeight + 3 + "px");

    this.datasetTooltipTriangle.transition().duration(delay).style("opacity", 0.9);
    this.datasetTooltipTriangle
      .html("\u25BC")
      .style("left", datasetLeft + datasetWidth / 2 - triangleWidth / 4 + "px")
      .style("top", datasetTop - triangleHeight + "px");
  }

  hideTooltip(delay = 500): void {
    this.datasetTooltip.transition().duration(delay).style("opacity", 0);
    this.datasetTooltipTriangle.transition().duration(delay).style("opacity", 0);
  }

  // creating tooltip for every node which will be hidden and when search is enabled, it will be shown
  createTooltipById(
    element,
    dataset: DatasetNode,
    id,
    datasetClientRects: Map<string, ClientRect>,
    svgClientRect: ClientRect
  ): void {
    const tooltip = new DatasetNodeToolTip();
    this.datasetToolTipArray[id] = tooltip;
    this.datasetToolTipArray[id].datasetId = dataset.datasetId;
    this.datasetToolTipArray[id].datasetName = dataset.name;

    // append tooltips to scolling div
    this.datasetToolTipArray[id].dataNodeToolTip = this.toolTipDiv
      .append("div")
      .attr("class", "dataset-node-tooltip")
      .attr("id", dataset.datasetId)
      .style("opacity", 0)
      .html("tooltip");

    const datasetLeft = datasetClientRects.get(dataset.datasetId).left;
    const datasetTop = datasetClientRects.get(dataset.datasetId).top;

    const tooltipHeight = 24;

    if (dataset) {
      this.datasetToolTipArray[id].dataNodeToolTip.html(dataset.name);
    }

    this.datasetToolTipArray[id].dataNodeToolTip
      .style("left", datasetLeft - svgClientRect.left - 5 + "px")
      .style("top", datasetTop - svgClientRect.top - tooltipHeight + 2 + "px");
  }

  showToolTipByIdForSearch(d, i, toolTipClientRects: Map<string, ClientRect>): void {
    //  Before showing the tooltip, we need to adjust the width so that in case of multiple tooltip in one row it nor get cluttere
    this.setCurrentToolTipName(i, toolTipClientRects);
    this.datasetToolTipArray[i].dataNodeToolTip.style("opacity", () =>
      WorkflowGraphComponent.getToolTipOpacity(this.filter.has(d.datasetId))
    );
  }

  showToolTipByIdForSelection(toolTipClientRects: Map<string, ClientRect>): void {
    for (let k = 0; k < this.selectedDatasets.length; k++) {
      this.setCurrentToolTipName(
        this.datasetToolTipArray.findIndex(
          (datasetToolTip) => datasetToolTip.datasetId === this.selectedDatasets[k].datasetId
        ),
        toolTipClientRects
      );
      this.datasetToolTipArray
        .find((datasetToolTip) => datasetToolTip.datasetId === this.selectedDatasets[k].datasetId)
        .dataNodeToolTip.style("opacity", 0.75);
    }
  }

  hideToolTipById(d, i): void {
    this.datasetToolTipArray[i].dataNodeToolTip.style("opacity", 0);
  }

  removeDatasetNodeToolTips(): void {
    const elements = document.getElementsByClassName("dataset-node-tooltip");
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }

  onZoomInandOut(): void {
    const tooltipHeight = this.datasetTooltip.node().getBoundingClientRect().height;

    const toolTipClientRects = this.getToolTipBoundingClientRects();

    for (let i = 0; i < this.datasetToolTipArray.length; i++) {
      const isInSearch = this.filter != null && this.filter.has(this.datasetToolTipArray[i].datasetId);
      const isSelected =
        this.selectedDatasets.filter((dataset) => dataset.datasetId === this.datasetToolTipArray[i].datasetId).length >
        0;
      if (isInSearch || isSelected) {
        let datasetLeft;
        let datasetTop;
        const element = document.getElementById("node_" + this.datasetToolTipArray[i].datasetId);
        if (element) {
          datasetLeft = element.getBoundingClientRect().left;
          datasetTop = element.getBoundingClientRect().top;
          this.datasetToolTipArray[i].dataNodeToolTip
            .style("left", datasetLeft - this.svg.node().getBoundingClientRect().left - 5 + "px")
            .style("top", datasetTop - this.svg.node().getBoundingClientRect().top - tooltipHeight + 2 + "px");
        }
        this.setCurrentToolTipName(i, toolTipClientRects);
      }
    }
  }

  getDatasetClientRects(): Map<string, ClientRect> {
    const datasetClientRects = new Map<string, ClientRect>();
    this.d3DatasetNodes.each(function (d) {
      const selection = d3.select(this).node();
      datasetClientRects.set(d.datasetId, selection.getBoundingClientRect());
    });
    return datasetClientRects;
  }

  /**
   * Get all rects in one go to avoid extra reflows
   */
  getToolTipBoundingClientRects(): Map<string, ClientRect> {
    const boundingClientRects = new Map<string, ClientRect>();
    this.datasetToolTipArray.forEach((datasetNode) => {
      const element = document.getElementById(datasetNode.datasetId);
      if (element != null) {
        const rect = element.getBoundingClientRect();

        boundingClientRects.set(datasetNode.datasetId, rect);
      }
    });
    return boundingClientRects;
  }

  setCurrentToolTipName(id: number, boundingClientRects: Map<string, ClientRect>): void {
    // First set the full name again
    this.datasetToolTipArray[id].dataNodeToolTip.html(this.datasetToolTipArray[id].datasetName);

    const curRect = boundingClientRects.get(this.datasetToolTipArray[id].datasetId);

    // checking the name
    for (let k = 0; k < this.datasetToolTipArray.length; k++) {
      const isNotSameDataset = this.datasetToolTipArray[id].datasetId !== this.datasetToolTipArray[k].datasetId;
      const isInSearch = this.filter != null && this.filter.has(this.datasetToolTipArray[k].datasetId);
      const isSelected =
        this.selectedDatasets.filter((dataset) => dataset.datasetId === this.datasetToolTipArray[k].datasetId).length >
        0;
      if (isNotSameDataset && (isSelected || isInSearch)) {
        const rectB = boundingClientRects.get(this.datasetToolTipArray[k].datasetId);

        if (this.workflowGraphService.isOverLapping(curRect, rectB)) {
          this.datasetToolTipArray[id].dataNodeToolTip.html(
            this.datasetToolTipArray[id].datasetName.split(".")[0].slice(0, 5) + "..."
          );
        }
      }
    }
  }

  private getPhenodataX(datasetNode: DatasetNode): number {
    return datasetNode.x + this.nodeWidth + this.xMargin + (this.nodeWidth - this.nodeHeight) / 2;

    // for icon
    // return datasetNode.x + this.nodeWidth + this.phenodataRadius - 2;
  }

  private getPhenodataY(datasetNode: DatasetNode): number {
    return datasetNode.y;

    // for icon
    // return datasetNode.y + this.nodeHeight / 2 + this.fontSize / 4 + 3;
  }

  private getPhenodataLabelX(datasetNode: DatasetNode): number {
    return this.getPhenodataX(datasetNode) + this.nodeHeight / 2;
  }

  private getPhenodataLabelY(datasetNode: DatasetNode): number {
    return this.getPhenodataY(datasetNode) + this.nodeHeight / 2 + this.fontSize / 4;
  }

  private getPhenodataLinkSourceX(datasetNode: DatasetNode): number {
    return datasetNode.x + this.nodeWidth;
  }

  private getPhenodataLinkTargetX(datasetNode: DatasetNode): number {
    return this.getPhenodataX(datasetNode);
  }

  private getPhenodataLinkY(datasetNode: DatasetNode): number {
    return this.getPhenodataY(datasetNode) + this.nodeHeight / 2;
  }

  private getPhenodataWarningX(datasetNode: DatasetNode): number {
    return this.getPhenodataLabelX(datasetNode) + 14;
  }

  private getPhenodataWarningY(datasetNode: DatasetNode): number {
    return this.getPhenodataLabelY(datasetNode) + 10;
  }

  private isDatasetNode(object: Node): object is DatasetNode {
    return "dataset" in object;
  }

  private initContextMenuItems() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.renameMenuItem = {
      title: "Rename...",
      action(d): void {
        const dataset = _.clone(d.dataset);
        self.dialogModalService
          .openStringModal("Rename file", "File name", dataset.name, "Rename")
          .pipe(
            mergeMap((name) => {
              dataset.name = name;
              return self.sessionDataService.updateDataset(dataset);
            })
          )
          .subscribe({
            error: (err) => self.restErrorService.showError("Rename file failed", err),
          });
      },
      disabled: false, // optional, defaults to false
    };

    this.convertMenuItem = {
      title: "Convert to Chipster Format...",
      action(d): void {
        self.datasetModalService.openWrangleModal(d.dataset, self.sessionData);
      },
      disabled: false, // optional, defaults to false
    };

    this.deleteMenuItem = {
      title: "Delete",
      action(): void {
        self.sessionDataService.deleteDatasetsLater(self.selectedDatasets);
      },
    };

    this.groupsMenuItem = {
      title: "Define Samples...",
      action(): void {
        self.datasetModalService.openGroupsModal(self.selectedDatasets, self.sessionData);
      },
    };

    this.selectChildrenMenuItem = {
      title: "Select Descendants",
      action(): void {
        const children = self.getSessionDataService.getChildren(self.selectionService.selectedDatasets);
        self.selectionHandlerService.setDatasetSelection(children);
      },
    };

    this.exportMenuItem = {
      title: "Export",
      action(d): void {
        self.sessionDataService.exportDatasets([d.dataset]);
      },
    };

    this.historyMenuItem = {
      title: "History...",
      action(d): void {
        self.datasetModalService.openDatasetHistoryModal(d.dataset, self.sessionData);
      },
    };

    this.dividerMenuItem = {
      divider: true,
    };
  }
}

export class Dimension {
  width: number;
  height: number;
}
