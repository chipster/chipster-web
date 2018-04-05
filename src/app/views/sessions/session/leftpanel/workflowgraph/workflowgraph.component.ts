import { SelectionService } from "../../selection.service";
import { DatasetNode } from "./dataset-node";
import Node from "./node";
import { Link } from "./link";
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from "@angular/core";
import Dataset from "../../../../../model/session/dataset";
import Job from "../../../../../model/session/job";
import Module from "../../../../../model/session/module";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import { SessionDataService } from "../../sessiondata.service";
import * as d3 from "d3";
import { WorkflowGraphService } from "./workflowgraph.service";
import { SessionEventService } from "../../sessionevent.service";
import * as _ from "lodash";
import { SelectionHandlerService } from "../../selection-handler.service";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import UtilsService from "../../../../../shared/utilities/utils";
import { Timer } from "d3-timer";

@Component({
  selector: "ch-workflow-graph",
  template: '<section id="workflowvisualization" class="full-size"></section>',
  styleUrls: ["./workflowgraph.component.less"],
  encapsulation: ViewEncapsulation.None
})
export class WorkflowGraphComponent implements OnInit, OnChanges, OnDestroy {
  svg: any;
  @Input() datasetsMap: Map<string, Dataset>;
  @Input() jobsMap: Map<string, Job>;
  @Input() modulesMap: Map<string, Module>;
  @Input() datasetSearch: string;
  @Input() defaultScale: number;
  @Input() enabled: boolean;

  private zoomMin = 0.2;
  private zoomMax = 2;

  private zoom;

  constructor(
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private pipeService: PipeService,
    private workflowGraphService: WorkflowGraphService,
    private selectionHandlerService: SelectionHandlerService,
    private store: Store<any>
  ) {}

  // actually selected datasets
  selectedDatasets: Array<Dataset>;

  // Streams for selected datasets and selectedJobs
  selectedDatasets$: Observable<Array<Dataset>>;

  // var shiftKey, ctrlKey;
  scrollerDiv: any;
  zoomGroup: any;

  d3DatasetNodesGroup: any;
  d3LinksGroup: any;
  d3LinksDefsGroup: any;
  d3LabelsGroup: any;
  background: any;

  d3Links: any;
  d3Labels: any;
  d3DatasetNodes: any;

  nodeWidth: number = this.workflowGraphService.nodeWidth;
  nodeHeight: number = this.workflowGraphService.nodeHeight;
  fontSize = 14;
  nodeRadius = 4;
  width: number;
  height: number;

  datasetNodes: Array<DatasetNode>;
  links: Array<Link>;
  filter: Map<string, Dataset>;
  datasetTooltip: any;
  datasetTooltipTriangle: any;

  dragStarted: boolean;

  subscriptions: Array<any> = [];

  static getOpacity(isVisible: boolean) {
    if (isVisible) {
      return 1.0;
    } else {
      return 0.25;
    }
  }

  ngOnInit() {
    this.selectedDatasets$ = this.store.select("selectedDatasets");

    const section = d3.select("#workflowvisualization");
    this.scrollerDiv = section.append("div").classed("scroller-div", true);

    // listern for background clicks
    section.on("click", () => {
      if (d3.event.target.tagName.toUpperCase() === "SVG") {
        this.selectionHandlerService.clearDatasetSelection();
        this.selectionHandlerService.clearJobSelection();
      }
    });

    if (this.enabled) {
      const toolbarDiv = section.append("div").classed("toolbar-div", true)
        .classed("btn-group", true);

      toolbarDiv.append("button").classed("btn btn-secondary", true)
        .on("click", e => this.zoomClick(1))
        .append("i").classed("fa fa-search-plus", true);

      toolbarDiv.append("button").classed("btn btn-secondary", true)
        .on("click", e => this.zoomClick(-1))
        .append("i").classed("fa fa-search-minus", true);
    }

    this.svg = this.scrollerDiv.append("svg");
    this.zoomGroup = this.svg.append("g");

      // order of these appends will determine the drawing order
    this.d3LinksGroup = this.zoomGroup
      .append("g")
      .attr("class", "link")
      .attr("id", "d3LinksGroup");
    this.d3LinksDefsGroup = this.d3LinksGroup.append("defs");
    this.d3DatasetNodesGroup = this.zoomGroup
      .append("g")
      .attr("class", "dataset node")
      .attr("id", "d3DatasetNodesGroup");
    this.d3LabelsGroup = this.zoomGroup.append("g").attr("class", "label");
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

    this.applyZoom("translate(0, 0) scale(" + this.defaultScale + ")");

    if (this.enabled) {
      this.subscriptions.push(
        this.sessionEventService.getDatasetStream().subscribe(() => {
          this.update();
          this.renderGraph();
        })
      );

      this.subscriptions.push(
        this.selectedDatasets$.subscribe((datasets: Array<Dataset>) => {
          this.selectedDatasets = datasets;
          this.update();
          this.renderGraph();
        })
      );
    }

    // show
    this.update();
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
      } else {
        this.filter = null;
      }
      this.renderGraph();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subs => subs.unsubscribe());
    this.subscriptions = [];
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
  zoomClick(direction: number) {

    // calculate the new scale
    const factor = (1 + 0.2 * direction);
    const targetScale = this.defaultScale * factor;

    // check if it is within limits
    if (targetScale < this.zoomMin || targetScale > this.zoomMax) {
      console.log("zoom limit reached");
      return false;
    }

    // zoom
    this.defaultScale = targetScale;
    this.applyZoom("translate(0, 0) scale(" + this.defaultScale + ")");

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

  applyZoom(transform: any) {
    this.zoomGroup.attr("transform", transform);
  }


  getParentSize() {
    return this.scrollerDiv.node().getBoundingClientRect();
  }

  getContentSize() {
    // graph size in graph coordinates
    const width = Math.max(...this.datasetNodes.map(d => d.x)) + this.nodeWidth + 15;
    const height = Math.max(...this.datasetNodes.map(d => d.y)) + this.nodeHeight + 15;

    // graph size in pixels after the zoom
    const scaledWidth = width * this.defaultScale;
    const scaledHeight = height * this.defaultScale;

    return { width: scaledWidth, height: scaledHeight };
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
      this.datasetsMap,
      this.jobsMap,
      this.modulesMap
    );

    const links = this.getLinks(datasetNodes);

    this.doLayout(links, datasetNodes);

    this.datasetNodes = datasetNodes;
    this.links = links;
  }


  isSelectedDataset(dataset: Dataset) {
    return (
      this.enabled &&
      this.selectionService.isSelectedDatasetById(dataset.datasetId)
    );
  }

  renderDatasets() {
    const self = this;

    // store the selection of all existing and new elements
    this.d3DatasetNodes = this.d3DatasetNodesGroup
      .selectAll("rect")
      .data(this.datasetNodes, d => d.datasetId);

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3DatasetNodes
      .enter()
      .append("rect")
      .merge(this.d3DatasetNodes)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("rx", this.nodeRadius)
      .attr("ry", this.nodeRadius)
      .attr("width", this.nodeWidth)
      .attr("height", this.nodeHeight)
      .style("fill", d => d.color)
      .style("opacity", d =>
        WorkflowGraphComponent.getOpacity(
          !this.filter || this.filter.has(d.datasetId)
        )
      )
      .classed("selected-dataset", d => this.isSelectedDataset(d.dataset))
      .on("click", function(d) {
        if (self.enabled) {
          self.selectionHandlerService.clearJobSelection();
          if (!UtilsService.isCtrlKey(d3.event)) {
            self.selectionHandlerService.clearDatasetSelection();
          }
          self.selectionHandlerService.toggleDatasetSelection([d.dataset]);
        }
      })
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

    this.d3DatasetNodes.exit().remove();

    // update the scroll limits if datasets were added or removed
    if (
      !this.d3DatasetNodes.enter().empty() ||
      !this.d3DatasetNodes.exit().empty()
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

    this.d3Links
      .filter(d =>
        this.selectionService.isSelectedDatasetById(d.source.dataset.datasetId)
      )
      .attr("x1", d => d.source.x + this.nodeWidth / 2)
      .attr("y1", d => d.source.y + this.nodeHeight);

    this.d3Links
      .filter(
        d =>
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
      .style("fill", "#555");

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
            .subscribe(
              () => null,
              err => console.log("dataset update error", err)
            );
        }
      });

    // update scroll limits if datasets were moved
    this.updateSvgSize();
  }

  renderGraph() {
    this.renderLinks();
    this.renderDatasets();
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
              // console.log('dataset\'s ' + dataset.name + ' category ' + sourceJob.toolCategory + ' not found')
            }
          } else {
            // console.log('dataset\'s ' + dataset.name + ' module ' + sourceJob.module + ' not found')
          }
        } else {
          // console.log("source job of dataset " + dataset.name + " not found");
        }
      } else {
        // console.log('dataset source job ' +  dataset.name + ' is null');
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
            console.log("node is its own parent", sourceNode);
          }
        });
        if (sourceJob.inputs.length === 0) {
          // console.log('source job doesn\'t have inputs', sourceJob);
        }
      } else {
        // console.log("no source job for ", targetNode);
      }
    });

    return links;
  }

  doLayout(links: Link[], nodes: Node[]) {
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
      .style("opacity", 1);

    if (dataset) {
      this.datasetTooltip.html(dataset.name);
    }
    this.datasetTooltip
      .style("left", datasetLeft - 5 + "px")
      .style("top", datasetTop - tooltipHeight - triangleHeight + 3 + "px");

    this.datasetTooltipTriangle
      .transition()
      .duration(delay)
      .style("opacity", 1);
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
}
