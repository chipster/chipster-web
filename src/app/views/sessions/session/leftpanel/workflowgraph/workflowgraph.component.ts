import Utils from "../../../../../services/utils.service";
import IWindowService = angular.IWindowService;
import WorkflowGraphService from "./workflowgraph.service";
import IScope = angular.IScope;
import Job from "../../../../../model/session/job";
import Dataset from "../../../../../model/session/dataset";
import Module from "../../../../../model/session/module";
import Node from "./node"
import * as d3 from "d3";
import {IChipsterFilter} from "../../../../../common/filter/chipsterfilter";
import {ChangeDetector, Comparison} from "../../../../../services/changedetector.service";
import {MapChangeDetector} from "../../../../../services/changedetector.service";
import {ArrayChangeDetector} from "../../../../../services/changedetector.service";
import SessionDataService from "../../sessiondata.service";
import SelectionService from "../../selection.service";
import UtilsService from "../../../../../services/utils.service";
import {DatasetNode} from "./dataset-node";
import {JobNode} from "./job-node";
import {Link} from "./link";

class WorkflowGraphController {

  static $inject = ['$scope', '$window', '$log', '$filter', 'SessionDataService', 'SelectionService', '$element'];

  constructor(private $scope: IScope,
              private $window: IWindowService,
              private $log: ng.ILogService,
              private $filter: IChipsterFilter,
              private SessionDataService: SessionDataService,
              private SelectionService: SelectionService,
              private $element: ng.IRootElementService) {
  }

  //var shiftKey, ctrlKey;
  svgContainer: d3.Selection<any>;
  svg: d3.Selection<any>;
  outerSvg: d3.Selection<any>;

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

  menu: any;
  nodeWidth: number = WorkflowGraphService.nodeWidth;
  nodeHeight: number = WorkflowGraphService.nodeHeight;
  fontSize = 14;
  nodeRadius = 4;
  width: number;
  height: number;
  zoom: number; // default zoom level
  lastScale: number; // last zoom level
  zoomer: any;

  datasetNodes: Array<DatasetNode>;
  jobNodes: Array<JobNode>;
  links: Array<Link>;
  filter: Map<string, Dataset>;

  datasetsMap: Map<string, Dataset>;
  jobsMap: Map<string, Job>;
  modulesMap: Map<string, Module>;
  datasetSearch: string;
  enabled: boolean;
  dragStarted: boolean;
  onDelete: () => void;

  changeDetectors: Array<ChangeDetector> = [];


  $onInit() {
    let self = this;

    this.zoomer = d3.zoom()
      .scaleExtent([0.2, 1])
      // .scaleBy(this.zoom)
      .on('zoom', this.zoomAndPan.bind(this));


    // used for adjusting the svg size
    this.svgContainer = d3.select('#workflowvisualization').append('div').classed('fill', true).classed('workflow-container', true);
    this.outerSvg = this.svgContainer.append('svg').call(this.zoomer);

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
      .on('click', function () {
        self.SelectionService.clearSelection();
        self.clearWorkflowSelections();
      });

    this.svg = this.outerSvg.append('g');

    this.updateSvgSize();

    // this.transformView(0, 0, this.zoomer.scale());

    // order of these appends will determine the drawing order
    this.d3JobNodesGroup = this.svg.append('g').attr('class', 'job node');
    this.d3LinksGroup = this.svg.append('g').attr('class', 'link');
    this.d3LinksDefsGroup = this.d3LinksGroup.append('defs');
    this.d3DatasetNodesGroup = this.svg.append('g').attr('class', 'dataset node');
    this.d3LabelsGroup = this.svg.append('g').attr('class', 'label');

    // initialize the comparison of input collections

    // shallow comparison is enough for noticing when the array is changed
    this.changeDetectors.push(new ArrayChangeDetector(() => this.SelectionService.selectedDatasets, () => {
      this.renderGraph()
    }, Comparison.Shallow));
    this.changeDetectors.push(new ArrayChangeDetector(() => this.SelectionService.selectedJobs, () => {
      this.renderGraph()
    }, Comparison.Shallow));

    // deep comparison is needed to notice the changes in the objects (e.g. rename)
    this.changeDetectors.push(new MapChangeDetector(() => this.datasetsMap, () => {
      this.update()
    }, Comparison.Deep));
    this.changeDetectors.push(new MapChangeDetector(() => this.jobsMap, () => {
      this.update()
    }, Comparison.Deep));
    this.changeDetectors.push(new MapChangeDetector(() => this.modulesMap, () => {
      this.update()
    }, Comparison.Deep));

  }

  $onChanges(changes: ng.IChangesObject<string>) {
    if (!this.svg) {
      // not yet initialized
      return;
    }

    if ("datasetSearch" in changes) {

      if (this.datasetSearch) {
        let filteredDatasets = this.$filter('searchDatasetFilter')(Utils.mapValues(this.datasetsMap), this.datasetSearch);
        this.filter = Utils.arrayToMap(filteredDatasets, 'datasetId');
      } else {
        this.filter = null;
      }
      this.renderGraph();
    }

  }

  $doCheck() {
    if (this.svg) {
      this.changeDetectors.forEach((cd: ChangeDetector) => cd.check());
      // it seems that there is no easy way to listen for div's size changes
      // running this on every digest cycle might be close enough
      this.updateSvgSize();
    }
  }

  updateSvgSize() {

    // get the DOM element with [0][0] ( when there is only one element in the selection)
    // let element: HTMLElement = <HTMLElement>this.svgContainer[0][0];
    let element = d3.selection('#workflowvisualization');

    // leave some pixels for margins, otherwise the element will grow
    this.width = 400;
    this.height = 400;

    this.outerSvg
      .attr('width', this.width)
      .attr('height', this.height);

    this.background
      .attr('width', this.width)
      .attr('height', this.height);

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

    this.d3JobNodes
      .enter()
      .append('rect')
      .attr('rx', this.nodeRadius)
      .attr('ry', this.nodeRadius)
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
      .style('fill', (d) => d.color)
      .attr('opacity', () => WorkflowGraphController.getOpacity(!this.filter))
      .classed('selected', (d) => this.isSelectedJob(d.job))
      .on('click', (d) => {
        this.SelectionService.selectJob(d3.event, d.job)
      })
      .on('mouseover', function () {
        d3.select(this).classed('hovering-job', true);
      })
      .on('mouseout', function () {
        d3.select(this).classed('hovering-job', false);
      });

    this.d3JobNodes.exit().remove();

    // create an arc for each job
    this.d3JobNodesGroup.selectAll('path')
      .data(this.jobNodes)
      .enter()
      .append('path')
      .style('fill', (d) => d.fgColor)
      .style('stroke-width', 0)
      .attr('opacity', this.filter ? 0.1 : 0.5)
      .style('pointer-events', 'none')
      // .transition()
      //   .duration(3000)
      //   .ease(d3.easeLinear)
      // .attrTween('transform', (d: JobNode) => {
      //   console.log(d);
      //
      //   let x = d.x + this.nodeWidth / 2;
      //   let y = d.y + this.nodeHeight / 2;
      //
      //   if (d.spin) {
      //     return d3.interpolateString( `translate(${x},${y})rotate(0)`, `translate(${x},${y})rotate(360)` );
      //   } else {
      //     return d3.interpolateString( `translate(${x},${y})`, `translate(${x},${y})` );
      //   }
      // })
      // .delay( () => 3000 )

  }

  isSelectedJob(job: Job) {
    return this.SelectionService.selectedJobs.indexOf(job) != -1;
  }

  isSelectedDataset(dataset: Dataset) {
    return this.SelectionService.selectedDatasets.indexOf(dataset) != -1;
  }

  renderDatasets() {

    var self = this;

    // store the selection of all existing and new elements
    this.d3DatasetNodes = this.d3DatasetNodesGroup.selectAll('rect').data(this.datasetNodes);
    this.d3DatasetNodes
      .enter().append('rect')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('rx', this.nodeRadius)
      .attr('ry', this.nodeRadius)
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .style("fill", (d) => d.color)
      .attr('opacity', (d) => this.getOpacityForDataset(d.dataset))
      .classed('selected', (d) => this.enabled && this.isSelectedDataset(d.dataset))
      .on('click', function (d) {
        if (!Utils.isCtrlKey(d3.event)) {
          self.SelectionService.clearSelection();
          self.clearWorkflowSelections();
        }
        self.SelectionService.toggleDatasetSelection(d3.event, d.dataset, UtilsService.mapValues(self.datasetsMap));
        d3.select(this).classed('selected-dataset', true);
      })
      .on('mouseover', function (d) {
        d3.select(this).classed('hovering-dataset', true);
      })
      .on('mouseout', function (d) {
        d3.select(this).classed('hovering-dataset', false);
      })
      .call(d3.drag()
        .on('drag', function (d) {
          this.dragStarted = true;
          self.dragNodes(d3.event.x, d3.event.dx, d3.event.y, d3.event.dy);
          // set defaultPrevented flag to disable scrolling
        })
        .on('end', () => {
          // check the flag to differentiate between drag and click events
          if (this.dragStarted) {
            this.dragStarted = false;
            this.dragEnd();
          }
        })
      );

    this.d3DatasetNodes.exit().remove();

  }

  getOpacityForDataset(d: Dataset) {
    return WorkflowGraphController.getOpacity(!this.filter || this.filter.has(d.datasetId));
  }

  static getOpacity(isVisible: boolean) {
    if (isVisible) {
      return 1.0;
    } else {
      return 0.25;
    }
  }

  renderLabels() {
    this.d3Labels = this.d3LabelsGroup.selectAll('text').data(this.datasetNodes);
    this.d3Labels
      .enter()
      .append('text')
      .text((d: any) => Utils.getFileExtension(d.name).slice(0, 4))
      .attr('x', (d) => d.x + this.nodeWidth / 2)
      .attr('y', (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4)
      .attr('font-size', this.fontSize + 'px').attr('fill', 'black').attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('opacity', (d) => this.getOpacityForDataset(d.dataset));

    this.d3Labels.exit().remove();
  }

  //Function to describe drag behavior
  dragNodes(x: number, dx: number, y: number, dy: number) {

    this.d3DatasetNodes
      .filter((d: DatasetNode) => this.isSelectedDataset(d.dataset))
      .attr('x', (d) => d.x += dx)
      .attr('y', (d) => d.y += dy);

    this.d3Labels
      .filter((d) => this.isSelectedDataset(d.dataset))
      .attr('x', (d) => d.x + this.nodeWidth / 2)
      .attr('y', (d) => d.y + this.nodeHeight / 2 + this.fontSize / 4);

    this.d3Links
      .filter((d) => this.isSelectedDataset(d.source.dataset))
      .attr('x1', (d) => d.source.x + this.nodeWidth / 2)
      .attr('y1', (d) => d.source.y + this.nodeHeight);

    this.d3Links
      .filter((d) => this.isSelectedDataset((<DatasetNode>d.target).dataset))
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

    this.d3Links
      .enter().append('line')
      .attr('x1', (d) => d.source.x + this.nodeWidth / 2)
      .attr('y1', (d) => d.source.y + this.nodeHeight)
      .attr('x2', (d) => d.target.x + this.nodeWidth / 2)
      .attr('y2', (d) => d.target.y)
      .attr('opacity', () => WorkflowGraphController.getOpacity(!this.filter))
      .on('click', function(d) {
        self.SelectionService.selectJob(d3.event, d.target.sourceJob);
        self.clearWorkflowSelections();
        d3.select(this).classed('selected-job', true);
      })
      .on('mouseover', function() {
        d3.select(this).classed('hovering-job', true);
      })
      .on('mouseout', function() {
        d3.select(this).classed('hovering-job', false);
      })
      .style('marker-end', 'url(#end)');

    this.d3Links.exit().remove();
  }


  dragEnd() {

    // update positions of all selected datasets to the server
    this.d3DatasetNodes
      .filter((d) => {
        return this.isSelectedDataset(d.dataset);
      })
      .each((d) => {
        if (d.dataset) {
          d.dataset.x = d.x;
          d.dataset.y = d.y;
          this.SessionDataService.updateDataset(d.dataset);
        }
      });
  }

  renderGraph() {

    if (!this.datasetNodes || !this.jobNodes || !this.links) {
      this.update();
    }

    this.renderLinks();
    this.renderJobs();
    this.renderDatasets();
    this.renderLabels();

  }

  zoomAndPan() {

    let event = d3.event;

    // allow default zoom level to be set even when disabled
    if (!this.enabled && event.scale !== this.zoom) {
      return;
    }

    // let zoom events go through, because those have always defaultPrevented === true
    if (event.scale === this.lastScale) {
      // disable scrolling when dragging nodes
      if (event.sourceEvent && event.sourceEvent.defaultPrevented) {
        return;
      }
    }
    this.lastScale = event.scale;

    // prevent scrolling over the top and left edges
    let tx = Math.min(0, event.translate[0]);
    let ty = Math.min(0, event.translate[1]);

    /*
     Set limited values as a starting point of the new events.
     Otherwise the coordinates keep growing when you scroll over the
     limits and you have to scroll back before anything happens.
     */
    this.zoomer.translate([tx, ty]);

    this.transformView(tx, ty, event.scale);
  }

  transformView(tx: number, ty: number, scale: number) {
    this.svg.attr('transform', 'translate('
      + [tx, ty] + ')'
      + 'scale(' + scale + ')');
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
          console.log('source job of dataset ' + dataset.name + ' not found');
        }
      }

      // when opening a session file, datasets may be without names for some time
      let name = dataset.name ? dataset.name : '';

      datasetNodes.push(<DatasetNode>{
        x: dataset.x,
        y: dataset.y,
        name: name,
        extension: Utils.getFileExtension(name),
        sourceJob: sourceJob,
        color: color,
        dataset: dataset
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

        if (job.state === 'FAILED') {
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
          sourceJob: job // to create links
        });
      }
    });
    return jobNodes;
  }

  spin(selection: any, duration: number){

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
        var pos = WorkflowGraphService.newPosition(nodes, link.source.x, link.source.y);
        link.target.x = pos.x;
        link.target.y = pos.y;
      }
    });

    // layout orphan nodes
    nodes.forEach((node) => {
      if (!node.x || !node.y) {
        var pos = WorkflowGraphService.newRootPosition(nodes);
        node.x = pos.x;
        node.y = pos.y;
      }
    });
  }

  clearWorkflowSelections() {
    d3.select('.selected-dataset').classed('selected-dataset', false);
    d3.select('.selected-job').classed('selected-job', false);
  }


}

export default {
  controller: WorkflowGraphController,
  templateUrl: './workflowgraph.html',
  bindings: {
    datasetsMap: '<',
    jobsMap: '<',
    modulesMap: '<',
    datasetSearch: '<',
    onDelete: '&',
    zoom: '<',
    enabled: '<'
  }
}
