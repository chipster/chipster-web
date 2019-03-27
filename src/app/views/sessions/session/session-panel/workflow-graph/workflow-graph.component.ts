import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from "@angular/core";
import { Store } from "@ngrx/store";
import { Dataset, Job, Module } from "chipster-js-common";
import * as d3 from "d3";
import * as d3ContextMenu from "d3-context-menu";
import * as _ from "lodash";
import log from "loglevel";
import { Observable } from "rxjs/Observable";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { NativeElementService } from "../../../../../shared/services/native-element.service";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import { SettingsService } from "../../../../../shared/services/settings.service";
import UtilsService from "../../../../../shared/utilities/utils";
import { DatasetService } from "../../dataset.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
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
  encapsulation: ViewEncapsulation.None
})
export class WorkflowGraphComponent implements OnInit, OnChanges, OnDestroy {
  svg: any;
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

  constructor(
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private pipeService: PipeService,
    private workflowGraphService: WorkflowGraphService,
    private selectionHandlerService: SelectionHandlerService,
    private store: Store<any>,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private nativeElementService: NativeElementService,
    private restErrorService: RestErrorService,
    private errorService: ErrorService,
    private settingService: SettingsService,
    private datasetService: DatasetService,
    private visualizationEventService: VisualizationEventService
  ) {}

  // actually selected datasets
  selectedDatasets: Array<Dataset>;

  // Streams for selected datasets and selectedJobs
  selectedDatasets$: Observable<Array<Dataset>>;

  // var shiftKey, ctrlKey;
  scrollerDiv: any;
  zoomGroup: any;
  toolTipDiv: any;

  d3DatasetNodesGroup: any;
  d3PhenodataNodesGroup: any;
  d3LinksGroup: any;
  d3LinksDefsGroup: any;
  d3LabelsGroup: any;
  d3PhenodataLabelsGroup: any;
  d3PhenodataWarningsGroup: any;
  d3PhenodataLinksGroup: any;

  background: any;

  d3Links: any;
  d3PhenodataLinks: any;
  d3Labels: any;
  d3PhenodataLabels: any;
  d3PhenodataWarnings: any;
  d3DatasetNodes: any;
  d3PhenodataNodes: any;

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
  datasetTooltip: any;
  datasetTooltipTriangle: any;

  datasetToolTipArray: Array<DatasetNodeToolTip> = [];

  dragStarted: boolean;

  searchEnabled: boolean;
  selectionEnabled = false;

  subscriptions: Array<any> = [];

  static getOpacity(isVisible: boolean) {
    if (isVisible) {
      return 1.0;
    } else {
      return 0.25;
    }
  }

  static getToolTipOpacity(isVisible: boolean) {
    if (isVisible) {
      return 0.75;
    } else {
      return 0.0;
    }
  }

  ngOnInit() {
    this.selectedDatasets$ = this.store.select("selectedDatasets");

    const section = d3.select("#workflowvisualization");
    this.scrollerDiv = section.append("div").classed("scroller-div", true);

    /*
    Listen for background clicks

    Don't do anything if the context menu is open, because then the user clicked just to close
    it. Listen for mousedown events like the context menu. This listener seems to be fired before the
    contextMenu onClose, so the isContextMenuOpen does what it says. Using stopPropagation() etc.
    in the context menu onClose doesn't help also, because this was called earlier.
    */
    section.on("mousedown", () => {
      if (
        d3.event.target.tagName.toUpperCase() === "SVG" &&
        !this.isContextMenuOpen
      ) {
        this.selectionHandlerService.clearDatasetSelection();
        this.selectionHandlerService.clearJobSelection();
      }
    });

    // disable back and forward gestures in Safari
    this.nativeElementService.disableGestures(this.scrollerDiv.node());

    this.svg = this.scrollerDiv.append("svg");
    this.zoomGroup = this.svg.append("g");

    // adding the tooltip div
    this.toolTipDiv = this.scrollerDiv
      .append("div")
      .classed("dataset-tooltip-div", true);
    this.toolTipDiv.id = "some_id";

    // order of these appends will determine the drawing order
    this.d3LinksGroup = this.zoomGroup
      .append("g")
      .attr("class", "link")
      .attr("id", "d3LinksGroup");
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
    this.d3PhenodataLabelsGroup = this.zoomGroup
      .append("g")
      .attr("class", "phenodataLabel");
    this.d3PhenodataWarningsGroup = this.zoomGroup
      .append("g")
      .attr("class", "phenodataWarning");
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
          },
          err => this.errorService.showError("get dataset events failed", err)
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
          err =>
            this.errorService.showError("get dataset selections failed", err)
        )
      );
    }

    // subscribe to data Selection tooltip show settings
    this.settingService.showDatasetSelectionTooltip$.subscribe(
      (res: boolean) => {
        this.showDatasetSelectionTooltip = res;
        this.renderGraph();
      }
    );

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

    /* Workaround for stuck svg rendering in Safari

    The svg text nodes and zoom changes aren't shown
    even if DOM is fine, until you move the split panel or something else changes.
    https://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes
    */
    const sel = <any>d3.select("#workflowvisualization").node();
    // tslint:disable-next-line:no-unused-expression
    sel.offsetHeight; // no need to store this anywhere, the reference is enough
  }

  ngOnChanges(changes: SimpleChanges) {
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

  ngOnDestroy() {
    this.removeDatasetNodeToolTips();
    this.subscriptions.forEach(subs => subs.unsubscribe());
    this.subscriptions = [];
  }

  zoomIn() {
    this.applyZoom((1 + this.zoomStepFactor) * this.zoomScale);
  }

  zoomOut() {
    this.applyZoom((1 - this.zoomStepFactor) * this.zoomScale);
  }

  resetZoomAndScroll() {
    // reset zoom
    this.zoomGroup.attr(
      "transform",
      "translate(0, 0) scale(" + this.defaultScale + ")"
    );
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
  applyZoom(targetScale: number) {
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
    this.zoomGroup.attr(
      "transform",
      "translate(0, 0) scale(" + limitedTargetScale + ")"
    );

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

  getParentSize() {
    return this.scrollerDiv.node().getBoundingClientRect();
  }

  getContentSize() {
    // graph size in graph coordinates
    // FIXME add phenodata?
    const width =
      Math.max(...this.datasetNodes.map(d => d.x)) + this.nodeWidth + 15;
    const height =
      Math.max(...this.datasetNodes.map(d => d.y)) + this.nodeHeight + 15;

    // graph size in pixels after the zoom
    const scaledWidth = width * this.zoomScale;
    const scaledHeight = height * this.zoomScale;

    return {
      width: scaledWidth,
      height: scaledHeight
    };
  }

  getSvgSize() {
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
  updateSvgSize() {
    const size = this.getSvgSize();

    this.svg.attr("width", size.width);
    this.svg.attr("height", size.height);
  }

  update() {
    const datasetNodes = this.getDatasetNodes(
      this.sessionDataService.getCompleteDatasets(this.datasetsMap),
      this.jobsMap,
      this.modulesMap
    );

    const links = this.getLinks(datasetNodes);

    this.doLayout(links, datasetNodes);

    this.datasetNodes = datasetNodes;
    this.phenodataNodes = datasetNodes.filter(datasetNode =>
      this.datasetService.hasOwnPhenodata(datasetNode.dataset)
    );
    this.links = links;
  }

  isSelectedDataset(dataset: Dataset) {
    return (
      this.enabled &&
      this.selectionService.isSelectedDatasetById(dataset.datasetId)
    );
  }

  renderPhenodataNodes() {
    const self = this;

    // store the selection of all existing and new elements
    this.d3PhenodataNodes = this.d3PhenodataNodesGroup
      .selectAll("rect")
      .data(this.phenodataNodes, d => d.datasetId);

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3PhenodataNodes
      .enter()
      .append("rect")
      .merge(this.d3PhenodataNodes)
      .attr("x", d => this.getPhenodataX(d))
      .attr("y", d => this.getPhenodataY(d))
      .attr("id", function(d) {
        return "node_" + d.datasetId;
      })
      // .attr("rx", this.nodeRadius)
      // .attr("ry", this.nodeRadius)
      .attr("width", this.nodeHeight)
      .attr("height", this.nodeHeight)
      // stroke and stroke width added
      .attr("stroke", d => d.color)
      .attr("stroke-width", "2")
      .attr("pointer-events", "all")
      //  .style("fill", d => d.color)
      .style("fill", "white")
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      )
      .classed("phenodata-node", true);
    // .classed("selected-dataset", d => this.isSelectedDataset(d.dataset));

    // // store the selection of all existing and new elements
    // this.d3PhenodataNodes = this.d3PhenodataNodesGroup
    //   .selectAll("text")
    //   .data(this.phenodataNodes, d => d.datasetId);

    // // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    // this.d3PhenodataNodes
    //   .enter()
    //   .append("text")
    //   .text((d: any) => "\uf069")
    //   .attr("x", d => this.getPhenodataX(d))
    //   .attr("y", d => this.getPhenodataY(d))
    //   .attr("class", "fa")
    //   .merge(this.d3PhenodataNodes)
    //   .attr("id", function(d) {
    //     return "phenodata_node_" + d.datasetId;
    //   })

    //   .attr("stroke", d =>
    //     this.datasetService.isPhenodataFilled(d.dataset) ? "gray" : "#ffc107"
    //   )
    //   .attr("font-size", "16px")
    //   .attr("stroke-width", "2")
    //   .attr("pointer-events", "all")
    //   .style("fill", "white")
    //   .style("opacity", d =>
    //     WorkflowGraphComponent.getOpacity(
    //       !this.filter || this.filter.has(d.datasetId)
    //     )
    //   )
    //   .classed("phenodata-node", true);

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
    if (
      !this.d3PhenodataNodes.enter().empty() ||
      !this.d3PhenodataNodes.exit().empty()
    ) {
      this.updateSvgSize();
    }
  }

  renderLabels() {
    this.d3Labels = this.d3LabelsGroup
      .selectAll("text")
      .data(this.datasetNodes, d => d.datasetId);

    this.d3Labels
      .enter()
      .append("text")
      .merge(this.d3Labels)
      .text((d: any) => UtilsService.getFileExtension(d.name).slice(0, 5))
      .attr("x", d => d.x + this.nodeWidth / 2)
      .attr("y", d => d.y + this.nodeHeight / 2 + this.fontSize / 4)
      .attr("font-size", d => {
        // use smaller font if the file extension is long
        if (UtilsService.getFileExtension(d.name).length <= 4) {
          return this.fontSize + "px";
        } else {
          return this.fontSize - 2 + "px";
        }
      })
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      );

    this.d3Labels.exit().remove();
  }

  renderPhenodataLabels() {
    this.d3PhenodataLabels = this.d3PhenodataLabelsGroup
      .selectAll("text")
      .data(this.phenodataNodes, d => d.datasetId);

    this.d3PhenodataLabels
      .enter()
      .append("text")
      .merge(this.d3PhenodataLabels)
      .text("P")
      .attr("x", d => this.getPhenodataLabelX(d))
      .attr("y", d => this.getPhenodataLabelY(d))
      .attr("font-size", this.fontSize + "px")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      );

    this.d3PhenodataLabels.exit().remove();
  }

  renderPhenodataWarnings() {
    this.d3PhenodataWarnings = this.d3PhenodataWarningsGroup
      .selectAll("text")
      .data(this.phenodataNodes, d => d.datasetId);

    this.d3PhenodataWarnings
      .enter()
      .append("text")
      .merge(this.d3PhenodataWarnings)

      // .text((d: any) => "\uf071")
      .text((d: any) => "\uf06a")

      .attr("x", d => this.getPhenodataLabelX(d) + 14)
      .attr("y", d => this.getPhenodataLabelY(d) + 10)
      .attr("class", "fa")
      .attr("font-size", this.fontSize + 4 + "px")
      .attr("fill", "#ffc107")
      .attr("stroke", "#ffc107")
      .attr("stroke-width", "0")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      )
      .classed("invisible", d =>
        this.datasetService.isPhenodataFilled(d.dataset)
      );

    this.d3PhenodataWarnings.exit().remove();
  }

  renderDatasets() {
    const self = this;

    // store the selection of all existing and new elements
    this.d3DatasetNodes = this.d3DatasetNodesGroup
      .selectAll("rect")
      .data(this.datasetNodes, d => d.datasetId);

    // context menu items
    const menu = [
      {
        title: "Rename",
        action: function(d, i) {
          const dataset = _.clone(d.dataset);
          self.dialogModalService
            .openStringModal(
              "Rename dataset",
              "Dataset name",
              dataset.name,
              "Rename"
            )
            .flatMap(name => {
              dataset.name = name;
              return self.sessionDataService.updateDataset(dataset);
            })
            .subscribe(null, err =>
              this.restErrorService.showErro("dataset rename failed", err)
            );
        },
        disabled: false // optional, defaults to false
      },
      {
        title: "Delete",
        action: function(d, i) {
          self.sessionDataService.deleteDatasetsLater(self.selectedDatasets);
        }
      },
      {
        title: "Export",
        action: function(d, i) {
          self.sessionDataService.exportDatasets([d.dataset]);
        }
      },
      {
        title: "History",
        action: function(d, i) {
          self.datasetModalService.openDatasetHistoryModal(
            d.dataset,
            self.sessionData
          );
        }
      }
    ];

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3DatasetNodes
      .enter()
      .append("rect")
      .merge(this.d3DatasetNodes)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("id", function(d) {
        return "node_" + d.datasetId;
      })
      .attr("rx", this.nodeRadius)
      .attr("ry", this.nodeRadius)
      .attr("width", this.nodeWidth)
      .attr("height", this.nodeHeight)
      // stroke and stroke width added
      .attr("stroke", d => d.color)
      .attr("stroke-width", "2")
      .attr("pointer-events", "all")
      //  .style("fill", d => d.color)
      .style("fill", "white")
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      )
      .classed("selected-dataset", d => this.isSelectedDataset(d.dataset))
      .on(
        "contextmenu",
        d3ContextMenu(menu, {
          onOpen: () => {
            this.isContextMenuOpen = true;
          },
          onClose: () => {
            this.isContextMenuOpen = false;
          }
        })
      )
      .on("mouseover", function(d) {
        if (self.enabled) {
          d3.select(this).classed("hovering-dataset", true);
          self.showTooltip(this, d);
        }
      })
      .on("mouseout", function() {
        if (self.enabled) {
          d3.select(this).classed("hovering-dataset", false);
          self.hideTooltip();
        }
      })
      .call(
        d3
          .drag()
          .on("drag", function(d: DatasetNode) {
            // don't allow datasets to be moved from the unselected dataset
            if (self.isSelectedDataset(d.dataset)) {
              self.dragStarted = true;
              self.hideTooltip(0);
              self.dragNodes(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
            }
          })
          .on("end", function(d) {
            // check the flag to differentiate between drag and click events
            if (self.dragStarted) {
              self.dragStarted = false;
              self.dragEnd();
              self.showTooltip(this, d, 0);
            }
          })
      );
    this.datasetToolTipArray = [];
    this.d3DatasetNodes.each(function(d, i) {
      const selection = d3.select(this).node();
      self.createTooltipById(selection, d, i);
    });

    // Show search Tooltips
    this.d3DatasetNodes.each(function(d, i) {
      if (self.searchEnabled) {
        self.showToolTipByIdForSearch(d, i);
      } else {
        self.hideToolTipById(d, i);
      }
    });

    this.d3DatasetNodes.on("click", function(d, i) {
      if (self.enabled) {
        self.selectionHandlerService.clearJobSelection();
        if (!UtilsService.isCtrlKey(d3.event)) {
          self.selectionHandlerService.clearDatasetSelection();
        }
        self.selectionHandlerService.toggleDatasetSelection([d.dataset]);
      }
    });

    // renderGraph() seems to get called twice and for some reason the datasetToolTipArray
    // is not populated during the first run, thus checks for avoiding error
    if (
      this.showDatasetSelectionTooltip &&
      this.selectionEnabled &&
      this.selectedDatasets.length > 0 &&
      this.datasetToolTipArray &&
      this.datasetToolTipArray.length > 0
    ) {
      this.showToolTipByIdForSelection();
    }

    this.d3DatasetNodes.exit().remove();

    // update the scroll limits if datasets were added or removedn
    if (
      !this.d3DatasetNodes.enter().empty() ||
      !this.d3DatasetNodes.exit().empty()
    ) {
      this.updateSvgSize();
    }
  }

  // Function to describe drag behavior
  // noinspection JSUnusedLocalSymbols
  dragNodes(x: number, dx: number, y: number, dy: number) {
    this.d3DatasetNodes
      .filter((d: DatasetNode) =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x", d => (d.x += dx))
      .attr("y", d => (d.y += dy));

    this.d3Labels
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x", d => d.x + this.nodeWidth / 2)
      .attr("y", d => d.y + this.nodeHeight / 2 + this.fontSize / 4);

    this.d3PhenodataNodes
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x", d => this.getPhenodataX(d))
      .attr("y", d => this.getPhenodataY(d));

    this.d3PhenodataLabels
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x", d => this.getPhenodataLabelX(d))
      .attr("y", d => this.getPhenodataLabelY(d));

    this.d3PhenodataWarnings
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x", d => this.getPhenodataWarningX(d))
      .attr("y", d => this.getPhenodataWarningY(d));

    this.d3PhenodataLinks
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.dataset.datasetId)
      )
      .attr("x1", d => this.getPhenodataLinkSourceX(d))
      .attr("y1", d => this.getPhenodataLinkY(d))
      .attr("x2", d => this.getPhenodataLinkTargetX(d))
      .attr("y2", d => this.getPhenodataLinkY(d));

    this.d3Links
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.source.dataset.datasetId)
      )
      .attr("x1", d => d.source.x + this.nodeWidth / 2)
      .attr("y1", d => d.source.y + this.nodeHeight);

    this.d3Links
      .filter(d =>
        d.target.dataset
          ? this.selectionService.isSelectedDatasetById(
              (<DatasetNode>d.target).dataset.datasetId
            )
          : false
      )
      .attr("x2", d => d.target.x + this.nodeWidth / 2)
      .attr("y2", d => d.target.y);
  }

  renderLinks() {
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
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(this.filter === null)
      );

    // Define the xy positions of the link
    this.d3Links = this.d3LinksGroup.selectAll("line").data(this.links);

    this.d3Links
      .enter()
      .append("line")
      .merge(this.d3Links)
      .attr("x1", d => d.source.x + this.nodeWidth / 2)
      .attr("y1", d => d.source.y + this.nodeHeight)
      .attr("x2", d => d.target.x + this.nodeWidth / 2)
      .attr("y2", d => d.target.y)
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(this.filter === null)
      )

      .on("click", function(d) {
        self.selectionHandlerService.setJobSelection([d.target.sourceJob]);
      })
      .on("mouseover", function() {
        if (this.enabled) {
          d3.select(this).classed("hovering-job", true);
        }
      })
      .on("mouseout", function() {
        if (this.enabled) {
          d3.select(this).classed("hovering-job", false);
        }
      })
      .style("marker-end", "url(#end)");

    this.d3Links.exit().remove();
  }

  renderPhenodataLinks() {
    const self = this;

    // Define the xy positions of the link
    this.d3PhenodataLinks = this.d3PhenodataLinksGroup
      .selectAll("line")
      .data(this.phenodataNodes);

    this.d3PhenodataLinks
      .enter()
      .append("line")
      .merge(this.d3PhenodataLinks)
      .attr("x1", d => this.getPhenodataLinkSourceX(d))
      .attr("y1", d => this.getPhenodataLinkY(d))
      .attr("x2", d => this.getPhenodataLinkTargetX(d))
      .attr("y2", d => this.getPhenodataLinkY(d))
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(this.filter === null)
      )
      .style("stroke-dasharray", "3, 3");

    this.d3Links.exit().remove();
  }

  dragEnd() {
    // update positions of all selected datasets to the server
    this.d3DatasetNodes
      .filter(d => {
        return this.selectionService.isSelectedDatasetById(d.dataset.datasetId);
      })
      .each(d => {
        if (d.dataset) {
          const datasetCopy = _.cloneDeep(d.dataset);
          datasetCopy.x = d.x;
          datasetCopy.y = d.y;

          this.sessionDataService
            .updateDataset(datasetCopy)
            .subscribe(null, err =>
              this.restErrorService.showError("dataset upate error", err)
            );
        }
      });

    // update scroll limits if datasets were moved
    this.updateSvgSize();
  }

  renderGraph() {
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
  ) {
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

      datasetNodes.push(<DatasetNode>{
        x: dataset.x,
        y: dataset.y,
        name: name,
        extension: UtilsService.getFileExtension(name),
        source: null,
        target: null,
        sourceJob: sourceJob,
        color: color,
        dataset: dataset,
        datasetId: dataset.datasetId,
        created: dataset.created
      });
    });

    return datasetNodes;
  }

  getLinks(nodes: Node[]) {
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
        sourceJob.inputs.forEach(function(input) {
          const sourceNode = datasetNodesMap.get(input.datasetId);
          if (sourceNode && targetNode) {
            links.push(<Link>{
              source: sourceNode,
              target: targetNode
            });
          } else {
            log.info("node is its own parent", sourceNode);
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

  doLayout(links: Link[], nodes: DatasetNode[]) {
    // layout nodes that don't yet have a position

    // layout nodes with parents
    // sort by the creation date to make parents precede their children in the array
    links
      .sort((a, b) => {
        return UtilsService.compareStringNullSafe(
          a.target.created,
          b.target.created
        );
      })
      .forEach(link => {
        if (!link.target.x || !link.target.y) {
          if (!link.source.x || !link.source.y) {
            // we have found an unpositioned parent
            // it must be a root node, because otherwise this loop would have positioned it already
            const newRootPos = this.workflowGraphService.newRootPosition(nodes);
            link.source.x = newRootPos.x;
            link.source.y = newRootPos.y;
          }
          const pos = this.workflowGraphService.newPosition(
            nodes,
            link.source.x,
            link.source.y
          );
          link.target.x = pos.x;
          link.target.y = pos.y;
        }
      });

    // layout orphan nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) {
        const pos = this.workflowGraphService.newRootPosition(nodes);
        node.x = pos.x;
        node.y = pos.y;
      }
    });
  }

  showTooltip(element: any, dataset: any, delay = 200) {
    const datasetLeft = element.getBoundingClientRect().left;
    const datasetTop = element.getBoundingClientRect().top;
    const datasetWidth = element.getBoundingClientRect().width;
    const tooltipHeight = this.datasetTooltip.node().getBoundingClientRect()
      .height;
    const triangleHeight = this.datasetTooltipTriangle
      .node()
      .getBoundingClientRect().height;
    const triangleWidth = this.datasetTooltipTriangle
      .node()
      .getBoundingClientRect().width;

    this.datasetTooltip
      .transition()
      .duration(delay)
      .style("opacity", 0.9);

    if (dataset) {
      this.datasetTooltip.html(dataset.name);
    }
    this.datasetTooltip
      .style("left", datasetLeft - 5 + "px")
      .style("top", datasetTop - tooltipHeight - triangleHeight + 3 + "px");

    this.datasetTooltipTriangle
      .transition()
      .duration(delay)
      .style("opacity", 0.9);
    this.datasetTooltipTriangle
      .html("\u25BC")
      .style("left", datasetLeft + datasetWidth / 2 - triangleWidth / 4 + "px")
      .style("top", datasetTop - triangleHeight + "px");
  }

  hideTooltip(delay = 500) {
    this.datasetTooltip
      .transition()
      .duration(delay)
      .style("opacity", 0);
    this.datasetTooltipTriangle
      .transition()
      .duration(delay)
      .style("opacity", 0);
  }

  // creating tooltip for every node which will be hidden and when search is enabled, it will be shown
  createTooltipById(element, dataset, id) {
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

    const datasetLeft = element.getBoundingClientRect().left;
    const datasetTop = element.getBoundingClientRect().top;
    const tooltipHeight = this.datasetTooltip.node().getBoundingClientRect()
      .height;

    if (dataset) {
      this.datasetToolTipArray[id].dataNodeToolTip.html(dataset.name);
    }
    this.datasetToolTipArray[id].dataNodeToolTip
      .style(
        "left",
        datasetLeft - this.svg.node().getBoundingClientRect().left - 5 + "px"
      )
      .style(
        "top",
        datasetTop -
          this.svg.node().getBoundingClientRect().top -
          tooltipHeight +
          2 +
          "px"
      );
  }

  showToolTipByIdForSearch(d, i) {
    //  Before showing the tooltip, we need to adjust the width so that in case of multiple tooltip in one row it nor get cluttere
    this.setCurrentToolTipName(i);
    this.datasetToolTipArray[i].dataNodeToolTip.style("opacity", x =>
      WorkflowGraphComponent.getToolTipOpacity(this.filter.has(d.datasetId))
    );
  }

  showToolTipByIdForSelection() {
    for (let k = 0; k < this.selectedDatasets.length; k++) {
      this.setCurrentToolTipName(
        this.datasetToolTipArray.findIndex(
          datasetToolTip =>
            datasetToolTip.datasetId === this.selectedDatasets[k].datasetId
        )
      );
      this.datasetToolTipArray
        .find(
          datasetToolTip =>
            datasetToolTip.datasetId === this.selectedDatasets[k].datasetId
        )
        .dataNodeToolTip.style("opacity", 0.75);
    }
  }

  hideToolTipById(d, i) {
    this.datasetToolTipArray[i].dataNodeToolTip.style("opacity", 0);
  }

  removeDatasetNodeToolTips() {
    const elements = document.getElementsByClassName("dataset-node-tooltip");
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }

  onZoomInandOut() {
    const tooltipHeight = this.datasetTooltip.node().getBoundingClientRect()
      .height;
    for (let i = 0; i < this.datasetToolTipArray.length; i++) {
      const isInSearch =
        this.filter != null &&
        this.filter.has(this.datasetToolTipArray[i].datasetId);
      const isSelected =
        this.selectedDatasets.filter(
          dataset => dataset.datasetId === this.datasetToolTipArray[i].datasetId
        ).length > 0;
      if (isInSearch || isSelected) {
        let datasetLeft, datasetTop;
        const element = document.getElementById(
          "node_" + this.datasetToolTipArray[i].datasetId
        );
        if (element) {
          datasetLeft = element.getBoundingClientRect().left;
          datasetTop = element.getBoundingClientRect().top;
          this.datasetToolTipArray[i].dataNodeToolTip
            .style(
              "left",
              datasetLeft -
                this.svg.node().getBoundingClientRect().left -
                5 +
                "px"
            )
            .style(
              "top",
              datasetTop -
                this.svg.node().getBoundingClientRect().top -
                tooltipHeight +
                2 +
                "px"
            );
        }
        this.setCurrentToolTipName(i);
      }
    }
  }

  setCurrentToolTipName(id: any) {
    // First set the full name again
    this.datasetToolTipArray[id].dataNodeToolTip.html(
      this.datasetToolTipArray[id].datasetName
    );
    const curRect = document
      .getElementById(this.datasetToolTipArray[id].datasetId)
      .getBoundingClientRect();

    // checking the name
    for (let k = 0; k < this.datasetToolTipArray.length; k++) {
      const isNotSameDataset =
        this.datasetToolTipArray[id].datasetId !==
        this.datasetToolTipArray[k].datasetId;
      const isInSearch =
        this.filter != null &&
        this.filter.has(this.datasetToolTipArray[k].datasetId);
      const isSelected =
        this.selectedDatasets.filter(
          dataset => dataset.datasetId === this.datasetToolTipArray[k].datasetId
        ).length > 0;
      if (isNotSameDataset && (isSelected || isInSearch)) {
        const rectB = document
          .getElementById(this.datasetToolTipArray[k].datasetId)
          .getBoundingClientRect();

        if (this.workflowGraphService.isOverLapping(curRect, rectB)) {
          this.datasetToolTipArray[id].dataNodeToolTip.html(
            this.datasetToolTipArray[id].datasetName.split(".")[0].slice(0, 5) +
              "..."
          );
        }
      }
    }
  }

  private getPhenodataX(datasetNode: DatasetNode) {
    return (
      datasetNode.x +
      this.nodeWidth +
      this.xMargin +
      (this.nodeWidth - this.nodeHeight) / 2
    );

    // for icon
    // return datasetNode.x + this.nodeWidth + this.phenodataRadius - 2;
  }

  private getPhenodataY(datasetNode: DatasetNode) {
    return datasetNode.y;

    // for icon
    // return datasetNode.y + this.nodeHeight / 2 + this.fontSize / 4 + 3;
  }

  private getPhenodataLabelX(datasetNode: DatasetNode) {
    return this.getPhenodataX(datasetNode) + this.nodeHeight / 2;
  }

  private getPhenodataLabelY(datasetNode: DatasetNode) {
    return (
      this.getPhenodataY(datasetNode) + this.nodeHeight / 2 + this.fontSize / 4
    );
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
}
