import {SelectionService} from "../../selection.service";
import {DatasetNode} from "./dataset-node";
import {JobNode} from "./job-node";
import Node from "./node";
import {Link} from "./link";
import {Component, Input, OnChanges, OnInit, SimpleChanges} from "@angular/core";
import Dataset from "../../../../../model/session/dataset";
import Job from "../../../../../model/session/job";
import Module from "../../../../../model/session/module";
import {PipeService} from "../../../../../shared/services/pipeservice.service";
import UtilsService from "../../../../../shared/utilities/utils";
import {SessionDataService} from "../../sessiondata.service";
import * as d3 from "d3";
import {WorkflowGraphService} from "./workflowgraph.service";
import {SessionEventService} from "../../sessionevent.service";
import * as _ from "lodash";
import {SelectionHandlerService} from "../../selection-handler.service";
import {Store} from "@ngrx/store";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-workflow-graph',
  template: '<section id="workflowvisualization"></section>'
})
export class WorkflowGraphComponent implements OnInit, OnChanges {

  @Input() datasetsMap: Map<string, Dataset>;
  @Input() jobsMap: Map<string, Job>;
  @Input() modulesMap: Map<string, Module>;
  @Input() datasetSearch: string;
  @Input() defaultScale: number;
  @Input() enabled: boolean;

  private zoom;

  constructor(private sessionDataService: SessionDataService,
              private sessionEventService: SessionEventService,
              private selectionService: SelectionService,
              private pipeService: PipeService,
              private workflowGraphService: WorkflowGraphService,
              private selectionHandlerService: SelectionHandlerService,
              private store: Store<any>) {
  }

  // actually selected datasets and jobs
  selectedDatasets: Array<Dataset>;
  selectedJobs: Array<Job>;

  // Streams for selected datasets and selectedJobs
  selectedDatasets$: Observable<Array<Dataset>>;
  selectedJobs$: Observable<Array<Job>>;

  //var shiftKey, ctrlKey;
  svgContainer: any;
  svg: any;
  outerSvg: any;

  d3DatasetNodesGroup: any;
  d3JobNodesGroup: any;
  d3LinksGroup: any;
  d3LinksDefsGroup: any;
  d3LabelsGroup: any;
  background: any;

  d3Links: any;
  d3Labels: any;
  d3DatasetNodes: any;
  d3JobNodes: any;

  nodeWidth: number = this.workflowGraphService.nodeWidth;
  nodeHeight: number = this.workflowGraphService.nodeHeight;
  fontSize = 14;
  nodeRadius = 4;
  width: number;
  height: number;

  datasetNodes: Array<DatasetNode>;
  jobNodes: Array<JobNode>;
  links: Array<Link>;
  filter: Map<string, Dataset>;
  datasetTooltip: any;
  datasetTooltipTriangle: any;

  dragStarted: boolean;

  subscriptions: Array<any> = [];


  ngOnInit() {

    this.selectedDatasets$ = this.store.select('selectedDatasets');
    this.selectedJobs$ = this.store.select('selectedJobs');

    // used for adjusting the svg size
    this.svgContainer = d3.select('#workflowvisualization').append('div').classed('fill', true).classed('workflow-container', true);
    this.outerSvg = this.svgContainer.append('svg');

    // draw background on outerSvg, so that it won't pan or zoom
    // invisible rect for listening background clicks
    this.background = this.outerSvg.append('g')
      .attr('class', 'background')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('opacity', 0)
      .on('click', () => {
        this.selectionHandlerService.clearSelections();
      });

    this.svg = this.outerSvg.append('g');

    // order of these appends will determine the drawing order
    this.d3JobNodesGroup = this.svg.append('g').attr('class', 'job node').attr('id', 'd3JobNodesGroup');
    this.d3LinksGroup = this.svg.append('g').attr('class', 'link').attr('id', 'd3LinksGroup');
    this.d3LinksDefsGroup = this.d3LinksGroup.append('defs');
    this.d3DatasetNodesGroup = this.svg.append('g').attr('class', 'dataset node').attr('id', 'd3DatasetNodesGroup');
    this.d3LabelsGroup = this.svg.append('g').attr('class', 'label');
    this.datasetTooltip = d3.select("body").append("div").attr("class", "dataset-tooltip").style("opacity", 0).html("tooltip");
    this.datasetTooltipTriangle = d3.select("body").append("div").attr("class", "dataset-tooltip-triangle").style("opacity", 0).html('\u25BC');

    if (this.enabled) {
      this.zoom = d3.zoom()
        .scaleExtent([0.2, 1])
        .on('zoom', () => {
          this.svg.attr("transform", d3.event.transform);
        });

      d3.select('g.background').call(this.zoom);
    } else {
      this.svg.attr('transform', 'translate(0,0) scale(' + this.defaultScale + ')');
    }

    // apply zoom
    if (this.enabled) {
      this.subscriptions.push(this.sessionEventService.getDatasetStream().subscribe(() => {
        this.update();
        this.renderGraph();
      }));

      this.subscriptions.push(this.sessionEventService.getJobStream().subscribe(() => {
        this.update();
        this.renderGraph();
      }));

      this.subscriptions.push(this.selectedDatasets$.subscribe((datasets: Array<Dataset>) => {
        this.selectedDatasets = datasets;
        this.update();
        this.renderGraph();
      }));

      this.subscriptions.push(this.selectedJobs$.subscribe((jobs: Array<Job>) => {
        this.selectedJobs = jobs;
        this.update();
        this.renderGraph();
      }));
    }

    // show
    this.update();
    this.renderGraph();
    this.setSVGSize();
  }

  ngOnChanges(changes: SimpleChanges) {

    if (!this.svg) {
      // not yet initialized
      return;
    }

    if ("datasetSearch" in changes) {

      if (this.datasetSearch) {
        let filteredDatasets = this.pipeService.findDataset(UtilsService.mapValues(this.datasetsMap), this.datasetSearch);
        this.filter = UtilsService.arrayToMap(filteredDatasets, 'datasetId');
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

  setSVGSize() {

    const jobNodesRect = document.getElementById('d3JobNodesGroup').getBoundingClientRect();
    const linksRect = document.getElementById('d3LinksGroup').getBoundingClientRect();
    const datasetNodesRect = document.getElementById('d3DatasetNodesGroup').getBoundingClientRect();
    const parent = document.getElementById('workflowvisualization').getBoundingClientRect();

    // have to calculate from the absolute coordinates (right, bottom etc.),
    // because bounding rect's width and height don't start the from the origo
    const contentWidth = _.max([jobNodesRect.right, linksRect.right, datasetNodesRect.right]) - parent.left;
    const contentHeight = _.max([jobNodesRect.bottom, linksRect.bottom, datasetNodesRect.bottom]) - parent.top;

    // svg should fill the parent. It's only a viewport, so the content or zoomming doesn't change it's size
    this.outerSvg.attr('width', parent.width).attr('height', parent.height);
    this.background.attr('width', parent.width).attr('height', parent.height);

    // This sets limits for the scrolling.
    // It must be large enough to accommodate all the content, but let it still
    // fill the whole viewport if the content is smaller than the viewport.
    // Otherwise d3 centers the content.
    const translateWidth = _.max([contentWidth, parent.width]);
    const translateHeight = _.max([contentHeight, parent.height]);

    if (this.zoom) {
      this.zoom.translateExtent([[0, 0], [translateWidth, translateHeight]]);
    }
  }


  update() {

    var datasetNodes = this.getDatasetNodes(this.datasetsMap, this.jobsMap, this.modulesMap);
    var jobNodes = this.getJobNodes(this.jobsMap);

    // Add datasets before jobs, because the layout will be done in this order.
    // Jobs should make space for the datasets in the layout, because
    // the jobs are only temporary.
    var allNodes = (<Array<Node>>datasetNodes).concat(jobNodes);

    var links = this.getLinks(allNodes);

    this.doLayout(links, allNodes);

    this.datasetNodes = datasetNodes;
    this.jobNodes = jobNodes;
    this.links = links;

  }

  renderJobs() {

    var arc = d3.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);

    this.d3JobNodes = this.d3JobNodesGroup.selectAll('rect').data(this.jobNodes);

    this.d3JobNodes.enter().append('rect').merge(this.d3JobNodes)
      .attr('rx', this.nodeRadius)
      .attr('ry', this.nodeRadius)
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
      .style('fill', (d) => d.color)
      .style('opacity', (d) => WorkflowGraphComponent.getOpacity(!this.filter))
      .classed('selected-job', (d) => this.isSelectedJob(d.job))
      .on('click', (d) => {
        if (this.enabled) {
          this.selectionHandlerService.setJobSelection([d.job]);
        }
      })
      .on('mouseover', function () {
        if (this.enabled) {
          d3.select(this).classed('hovering-job', true);
        }
      })
      .on('mouseout', function () {
        if (this.enabled) {
          d3.select(this).classed('hovering-job', false);
        }
      });

    this.d3JobNodes.exit().remove();

    // create an arc for each job
    let d3JobArcs = this.d3JobNodesGroup.selectAll('path').data(this.jobNodes);

    d3JobArcs.enter().append('path').merge(d3JobArcs)
      .style('fill', (d) => d.fgColor)
      .style('stroke-width', 0)
      .attr('opacity', this.filter ? 0.1 : 0.5)
      .style('pointer-events', 'none')
      .attr('d', arc)
      .transition()
      .duration(3000)
      .ease(d3.easeLinear)
      .attrTween('transform', (d: JobNode) => {
        let x = d.x + this.nodeWidth / 2;
        let y = d.y + this.nodeHeight / 2;
        return d.spin ? d3.interpolateString(`translate(${x},${y})rotate(0)`, `translate(${x},${y})rotate(360)`) : d3.interpolateString(`translate(${x},${y})`, `translate(${x},${y})`);
      });

    d3JobArcs.exit().remove();

  }

  isSelectedJob(job: Job) {
    return this.selectedJobs && this.selectedJobs.indexOf(job) != -1;
  }

  isSelectedDataset(dataset: Dataset) {
    return this.enabled && this.selectionService.isSelectedDatasetById(dataset.datasetId);
  }

  renderDatasets() {

    var self = this;

    // store the selection of all existing and new elements
    this.d3DatasetNodes = this.d3DatasetNodesGroup.selectAll('rect')
      .data(this.datasetNodes, d => d.datasetId);

    // enter().append() creates elements for the new nodes, then merge old nodes to configure them all
    this.d3DatasetNodes.enter().append('rect').merge(this.d3DatasetNodes)
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('rx', this.nodeRadius)
      .attr('ry', this.nodeRadius)
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .style("fill", (d) => d.color)
      .style('opacity', (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)))
      .classed('selected-dataset', (d) => this.isSelectedDataset(d.dataset))
      .on('click', function (d) {
        if (self.enabled) {
          self.selectionHandlerService.clearJobSelection();
          if (!UtilsService.isCtrlKey(d3.event)) {
            self.selectionHandlerService.clearDatasetSelection();
          }
          self.selectionHandlerService.toggleDatasetSelection([d.dataset]);
        }
      })
      .on('mouseover', function (d) {
        if (self.enabled) {
          d3.select(this).classed('hovering-dataset', true);
          self.showTooltip(this, d);
        }
      })
      .on('mouseout', function (d) {
        if (self.enabled) {
          d3.select(this).classed('hovering-dataset', false);
          self.hideTooltip();
        }
      })
      .call(d3.drag()
        .on('drag', function (d: DatasetNode) {
          // don't allow datasets to be moved from the unselected dataset
          if (self.isSelectedDataset(d.dataset)) {
            self.dragStarted = true;
            self.hideTooltip(0);
            self.dragNodes(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
          }
        })
        .on('end', function (d) {
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
    if (!this.d3DatasetNodes.enter().empty() || !this.d3DatasetNodes.exit().empty()) {
      this.setSVGSize();
    }
  }

  static getOpacity(isVisible: boolean) {
    if (isVisible) {
      return 1.0;
    } else {
      return 0.25;
    }
  }

  renderLabels() {

    this.d3Labels = this.d3LabelsGroup.selectAll('text')
      .data(this.datasetNodes, d => d.datasetId);

    this.d3Labels.enter().append('text').merge(this.d3Labels)
      .text((d: any) => UtilsService.getFileExtension(d.name).slice(0, 4))
      .attr('x', (d) => d.x + this.nodeWidth / 2)
      .attr('y', (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4)
      .attr('font-size', this.fontSize + 'px').attr('fill', 'black').attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .style('opacity', (d) => WorkflowGraphComponent.getOpacity(!this.filter || this.filter.has(d.datasetId)));

    this.d3Labels.exit().remove();
  }

  //Function to describe drag behavior
  dragNodes(x: number, dx: number, y: number, dy: number) {

    this.d3DatasetNodes
      .filter((d: DatasetNode) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr('x', (d) => d.x += dx)
      .attr('y', (d) => d.y += dy);

    this.d3Labels
      .filter((d) => this.selectionService.isSelectedDatasetById(d.dataset.datasetId))
      .attr('x', (d) => d.x + this.nodeWidth / 2)
      .attr('y', (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4);

    this.d3Links
      .filter((d) => this.selectionService.isSelectedDatasetById(d.source.dataset.datasetId))
      .attr('x1', (d) => d.source.x + this.nodeWidth / 2)
      .attr('y1', (d) => d.source.y + this.nodeHeight);

    this.d3Links
      .filter((d) => d.target.dataset ? this.selectionService.isSelectedDatasetById((<DatasetNode>d.target).dataset.datasetId) : false )
      .attr('x2', (d) => d.target.x + this.nodeWidth / 2)
      .attr('y2', (d) => d.target.y);
  }


  renderLinks() {
    let self = this;

    //building the arrows for the link end
    this.d3LinksDefsGroup.selectAll('marker').data(['end']).enter().append('marker')
      .attr('id', String)
      .attr('viewBox', '-7 -7 14 14')
      .attr('refX', 6)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M 0,0 m -7,-7 L 7,0 L -7,7 Z')
      .style('fill', '#555');

    //Define the xy positions of the link
    this.d3Links = this.d3LinksGroup.selectAll('line').data(this.links);

    this.d3Links.enter().append('line').merge(this.d3Links)
      .attr('x1', (d) => d.source.x + this.nodeWidth / 2)
      .attr('y1', (d) => d.source.y + this.nodeHeight)
      .attr('x2', (d) => d.target.x + this.nodeWidth / 2)
      .attr('y2', (d) => d.target.y)
      .on('click', function (d) {
        self.selectionHandlerService.setJobSelection([d.target.sourceJob]);
      })
      .on('mouseover', function () {
        if (this.enabled) {
          d3.select(this).classed('hovering-job', true);
        }
      })
      .on('mouseout', function () {
        if (this.enabled) {
          d3.select(this).classed('hovering-job', false);
        }
      })
      .style('marker-end', 'url(#end)');

    this.d3Links.exit().remove();
  }


  dragEnd() {

    // update positions of all selected datasets to the server
    this.d3DatasetNodes
      .filter((d) => {
        return this.selectionService.isSelectedDatasetById(d.dataset.datasetId);
      })
      .each((d) => {
        if (d.dataset) {
          d.dataset.x = d.x;
          d.dataset.y = d.y;
          this.sessionDataService.updateDataset(d.dataset);
        }
      });

    // update scroll limits if datasets were moved
    this.setSVGSize();
  }

  renderGraph() {
    this.renderLinks();
    this.renderJobs();
    this.renderDatasets();
    this.renderLabels();
  }

  getDatasetNodes(datasetsMap: Map<string, Dataset>, jobsMap: Map<string, Job>, modulesMap: Map<string, Module>) {

    var datasetNodes: DatasetNode[] = [];
    datasetsMap.forEach((dataset: Dataset) => {

      var color = 'gray';

      if (dataset.sourceJob) {
        if (jobsMap.has(dataset.sourceJob)) {
          var sourceJob = jobsMap.get(dataset.sourceJob);

          var module = modulesMap.get(sourceJob.module);
          if (module) {
            var category = module.categoriesMap.get(sourceJob.toolCategory);
            if (category) {
              color = category.color;
            }
          }
        } else {
          //console.log('source job of dataset ' + dataset.name + ' not found');
        }
      }

      // when opening a session file, datasets may be without names for some time
      let name = dataset.name ? dataset.name : '';

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
        datasetId: dataset.datasetId
      });
    });

    return datasetNodes;
  }

  getJobNodes(jobsMap: Map<string, Job>) {

    var jobNodes: JobNode[] = [];
    jobsMap.forEach((job) => {
      // no need to show completed jobs
      if (job.state !== 'COMPLETED') {

        var fgColor = '#4d4ddd';
        var color = 'lightGray';
        var spin = true;

        if (job.state === 'FAILED' || job.state === 'EXPIRED_WAITING') {
          color = 'yellow';
          spin = false;
        }

        if (job.state === 'ERROR') {
          color = 'red';
          spin = false;
        }

        jobNodes.push(<JobNode>{
          x: null,
          y: null,
          fgColor: fgColor,
          color: color,
          spin: spin,
          job: job,
          sourceJob: job, // to create links
        });
      }
    });
    return jobNodes;
  }

  spin(selection: any, duration: number) {

    // first round
    selection
      .transition()
      .ease('linear')
      .duration(duration)
      .attrTween('transform', (d: JobNode) => {

        var x = d.x + this.nodeWidth / 2;
        var y = d.y + this.nodeHeight / 2;

        if (d.spin) {
          return d3.interpolateString(
            'translate(' + x + ',' + y + ')rotate(0)',
            'translate(' + x + ',' + y + ')rotate(360)'
          );
        } else {
          return d3.interpolateString(
            'translate(' + x + ',' + y + ')',
            'translate(' + x + ',' + y + ')'
          );
        }
      });

    // schedule the next round
    setTimeout(() => {
      this.spin(selection, duration);
    }, duration);
  }


  getLinks(nodes: Node[]) {

    var links: Link[] = [];

    // map for searching source
    var datasetNodesMap = new Map();
    nodes.forEach((node: DatasetNode) => {
      if (node.dataset) {
        datasetNodesMap.set(node.dataset.datasetId, node);
      }
    });


    nodes.forEach((targetNode: Node) => {
      if (targetNode.sourceJob) {
        var sourceJob = targetNode.sourceJob;
        // iterate over the inputs of the source job
        sourceJob.inputs.forEach(function (input) {
          var sourceNode = datasetNodesMap.get(input.datasetId);
          if (sourceNode && targetNode) {
            links.push(<Link>{
              source: sourceNode,
              target: targetNode
            });
          }
        });
      }
    });

    return links;
  }

  doLayout(links: Link[], nodes: Node[]) {

    // layout nodes that don't yet have a position

    // layout nodes with parents (assumes that a parent precedes its childrens in the array)
    links.forEach((link) => {
      if (!link.target.x || !link.target.y) {
        var pos = this.workflowGraphService.newPosition(nodes, link.source.x, link.source.y);
        link.target.x = pos.x;
        link.target.y = pos.y;
      }
    });

    // layout orphan nodes
    nodes.forEach((node) => {
      if (!node.x || !node.y) {
        var pos = this.workflowGraphService.newRootPosition(nodes);
        node.x = pos.x;
        node.y = pos.y;
      }
    });
  }

  showTooltip(element: any, dataset: any, delay = 200) {
    let datasetLeft = element.getBoundingClientRect().left;
    let datasetTop = element.getBoundingClientRect().top;
    let datasetWidth = element.getBoundingClientRect().width;
    let tooltipHeight = this.datasetTooltip.node().getBoundingClientRect().height;
    let triangleHeight = this.datasetTooltipTriangle.node().getBoundingClientRect().height;
    let triangleWidth = this.datasetTooltipTriangle.node().getBoundingClientRect().width;

    this.datasetTooltip.transition()
      .duration(delay)
      .style("opacity", 1);

    if (dataset) {
      this.datasetTooltip.html(dataset.name);
    }
    this.datasetTooltip.style("left", (datasetLeft - 5) + "px")
      .style("top", (datasetTop - tooltipHeight - triangleHeight + 3) + "px");

    this.datasetTooltipTriangle.transition()
      .duration(delay)
      .style("opacity", 1);
    this.datasetTooltipTriangle.html('\u25BC')
      .style("left", (datasetLeft + datasetWidth / 2 - triangleWidth / 4) + "px")
      .style("top", (datasetTop - triangleHeight) + "px");
  }

  hideTooltip(delay = 500) {
    this.datasetTooltip.transition()
      .duration(delay)
      .style("opacity", 0);
    this.datasetTooltipTriangle.transition()
      .duration(delay)
      .style("opacity", 0);
  }

}
