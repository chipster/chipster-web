import Utils from "../../../../services/utils.service";
import IWindowService = angular.IWindowService;
import WorkflowGraphService from "./workflowgraph.service";
import IScope = angular.IScope;
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Module from "../../../../model/session/module";
import Node from "./node"
import {IChipsterFilter} from "../../../../common/filter/chipsterfilter";
import {ChangeDetector, Comparison} from "../../../../services/changedetector.service";
import {MapChangeDetector} from "../../../../services/changedetector.service";
import {ArrayChangeDetector} from "../../../../services/changedetector.service";
import SessionDataService from "../sessiondata.service";
import SelectionService from "../selection.service";
import * as d3 from "d3";
import UtilsService from "../../../../services/utils.service";

interface DatasetNode extends Node {
	dataset: Dataset;
	datasetId?: string;
	name: string;
	extension: string;
}

interface JobNode extends Node {
	job: Job;
	fgColor: string;
	spin: boolean;
}

interface Link {
	source: DatasetNode;
	target: Node;
}

class WorkflowGraphController {

	static $inject = ['$scope', '$window', '$log', '$filter', 'SessionDataService', 'SelectionService'];

	constructor(
		private $scope: IScope,
		private $window: IWindowService,
		private $log: ng.ILogService,
		private $filter: IChipsterFilter,
		private SessionDataService: SessionDataService,
		private SelectionService: SelectionService) {

		this.callback = {
			clearSelection: () => this.SelectionService.clearSelection(),
			selectJob: ($event: any, job: Job) => this.SelectionService.selectJob($event, job),
			showDefaultVisualization: () => this.showDefaultVisualization(),
			updateDataset: (dataset: Dataset) => this.SessionDataService.updateDataset(dataset)
		};
	}

	d3: any = this.$window['d3'];
	//var shiftKey, ctrlKey;
	svg: d3.Selection<any>;
	outerSvg: d3.Selection<any>;

	d3DatasetNodesGroup: d3.Selection<DatasetNode>;
	d3JobNodesGroup: d3.Selection<JobNode>;
	d3LinksGroup: d3.Selection<Link>;
	d3LinksDefsGroup: d3.Selection<any>;
	d3LabelsGroup: d3.Selection<DatasetNode>;
	background: d3.Selection<any>;

	d3Links: d3.selection.Update<Link>;
	d3Labels: d3.selection.Update<DatasetNode>;
	d3DatasetNodes: d3.selection.Update<DatasetNode>;
	d3JobNodes: d3.selection.Update<JobNode>;

	menu:any;
	nodeWidth:number = WorkflowGraphService.nodeWidth;
	nodeHeight:number = WorkflowGraphService.nodeHeight;
	fontSize = 14;
	nodeRadius = 4;
	width:number;
	height:number;
	zoom: number; // default zoom level
	lastScale: number; // last zoom level
	zoomer: d3.behavior.Zoom<any>;

	datasetNodes: Array<DatasetNode>;
	jobNodes: Array<JobNode>;
	links: Array<Link>;
	filter: Map<string, Dataset>;

	datasetsMap: Map<string, Dataset>;
	jobsMap: Map<string, Job>;
	modulesMap: Map<string, Module>;
	selectedDatasets: Array<Dataset>;
	selectedJobs: Array<Job>;
	datasetSearch: string;
	callback: any;
	enabled: boolean;
	dragStarted: boolean;

	changeDetectors: Array<ChangeDetector> = [];

	$onInit() {

		var element = WorkflowGraphController.getElement();

		this.zoomer = this.d3.behavior.zoom()
			.scaleExtent([ 0.2, 1 ])
			.scale(this.zoom)
			.on('zoom', this.zoomAndPan.bind(this));

		this.outerSvg = this.d3.select(element).append('svg').call(this.zoomer);

		// draw background on outerSvg, so that it won't pan or zoom
		this.renderBackground(this.outerSvg);

		this.svg = this.outerSvg.append('g');

		this.updateSvgSize();

		// order of these appends will determine the drawing order

		this.d3DatasetNodesGroup = this.svg.append('g').attr('class', 'dataset node');
		this.d3JobNodesGroup = this.svg.append('g').attr('class', 'job node');
		this.d3LinksGroup = this.svg.append('g').attr('class', 'link');
		this.d3LinksDefsGroup = this.d3LinksGroup.append('defs');
		this.d3LabelsGroup = this.svg.append('g').attr('class', 'label');

		this.createShadowFilter();

		// initialize the comparison of input collections

		// shallow comparison is enough for noticing when the array is changed
		this.changeDetectors.push(new ArrayChangeDetector(() => this.selectedDatasets, () => {
			this.renderGraph();
		}, Comparison.Shallow));
		this.changeDetectors.push(new ArrayChangeDetector(() => this.selectedJobs, () => {
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

	$onChanges(changes: ng.IChangesObject) {

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

		let element = WorkflowGraphController.getElement();

		// leave some pixels for margins, otherwise the element will grow
		this.width = Math.max(200, element.offsetWidth);
		this.height = Math.max(200, element.offsetHeight - 5);

		this.outerSvg
			.attr('width', this.width)
			.attr('height', this.height);

		this.background
			.attr('width', this.width)
			.attr('height', this.height);
	}

	static getElement() {
		return document.getElementById('workflow-container');
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

		this.renderGraph();
	}

	renderJobs() {

		var arc = <d3.svg.Arc<JobNode>>this.d3.svg.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);

		var self = this;

		this.d3JobNodes = this.d3JobNodesGroup.selectAll('rect').data(this.jobNodes);

		// create the new job nodes and throw away the selection of created nodes
		this.d3JobNodes.enter().append('rect');

		// update all job nodes
		this.d3JobNodes
			.attr('rx', this.nodeRadius)
			.attr('ry', this.nodeRadius)
			.attr('width', this.nodeWidth)
			.attr('height', this.nodeHeight)
			.attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
			.style('fill', (d) => d.color)
			.attr('opacity', () => WorkflowGraphController.getOpacity(!this.filter))
			.classed('selected', (d) => self.enabled && self.isSelectedJob(d.job))
			.on('click', (d) => {
				if (!this.enabled) {
					return;
				}
				this.$scope.$apply(this.callback.selectJob(this.d3.event, d.job));
			})
			.on('mouseover', function () {
				self.d3.select(this).style('filter', 'url(#drop-shadow)');
			})
			.on('mouseout', function () {
				self.d3.select(this).style('filter', null);
			});

		// create an arc for each job
		this.d3JobNodesGroup.selectAll('path').data(this.jobNodes).enter().append('path')
			.style('fill', (d) => d.fgColor)
			.style('stroke-width', 0)
			.attr('opacity', this.filter? 0.1 : 0.5)
			.style('pointer-events', 'none')
			.attr('d', arc)
			.call(this.spin.bind(this), 3000);
	}

	isSelectedJob(job: Job) {
		return this.selectedJobs.indexOf(job) != -1;
	}

	isSelectedDataset(dataset: Dataset) {
		return this.selectedDatasets.indexOf(dataset) != -1;
	}

	showDefaultVisualization() {
		this.$scope.$broadcast('showDefaultVisualization', {});
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
					return this.d3.interpolateString(
						'translate(' + x + ',' + y + ')rotate(0)',
						'translate(' + x + ',' + y + ')rotate(360)'
					);
				} else {
					return this.d3.interpolateString(
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

	renderBackground(parent: d3.Selection<any>) {

		// invisible rect for listening background clicks
		this.background = parent.append('g').attr('class', 'background').append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', this.width)
			.attr('height', this.height)
			//.attr('fill', 'white')
			.attr('opacity', 0)
			.on('click', () => {
				if (this.enabled) {
					this.$scope.$apply(this.callback.clearSelection());
				}
			});
	}

	renderDatasets(){

		var tip = this.d3['tip']()
			.attr('class','d3-tip')
			.offset([-10,0])
			.html((d: DatasetNode) => d.name);

		this.svg.call(tip);

		var self = this;

		// store the selection of all existing and new elements
		this.d3DatasetNodes = this.d3DatasetNodesGroup.selectAll('rect').data(this.datasetNodes);

		// don't store this selection, because enter() returns only the new elements
		this.d3DatasetNodes.enter().append('rect');

		// apply to all elements (old and new)
		this.d3DatasetNodes
			.attr('x', (d) => d.x )
			.attr('y', (d) => d.y )
			.attr('rx', this.nodeRadius)
			.attr('ry', this.nodeRadius)
			.attr('width', this.nodeWidth)
			.attr('height', this.nodeHeight)
			.style("fill", (d) => d.color)
			.attr('opacity', (d) => this.getOpacityForDataset(d.dataset))
			.classed('selected', (d) => this.enabled && this.isSelectedDataset(d.dataset))
			.on('dblclick', () => {
				if (!this.enabled) {
					return;
				}
				this.callback.showDefaultVisualization();
			})
			.on('click', (d) => {
				if (!this.enabled) {
					return;
				}
				this.$scope.$apply(() => {
					if (!Utils.isCtrlKey(this.d3.event)) {
						this.callback.clearSelection();
					}
					this.SelectionService.toggleDatasetSelection(this.wd3.event, d.dataset, UtilsService.mapValues(this.datasetsMap));
				});
				tip.hide(d);
			})
			.call(this.d3.behavior.drag()
				.on('drag', () => {
					let event = <d3.DragEvent>this.d3.event;
					if (!this.enabled) {
						return;
					}
					this.dragStarted = true;
					this.dragNodes(event.dx, event.dy);
					// set defaultPrevented flag to disable scrolling
					event.sourceEvent.preventDefault();
				})
				.on('dragend', () => {
					// check the flag to differentiate between drag and click events
					if (this.dragStarted) {
						this.dragStarted = false;
						this.dragEnd();
					}
				})
			)
			.on('contextmenu', this.d3['contextMenu'](this.menu).bind(this))
			.on('mouseover', function(d) {
				if (!self.enabled) {
					return;
				}
				// how to get the current element without select(this) so that we can bind(this)
				// and get rid of 'self'
				self.d3.select(this).style('filter', 'url(#drop-shadow)');
				tip.show(d);
			})
			.on('mouseout', function(d) {
				if (!self.enabled) {
					return;
				}
				self.d3.select(this).style('filter', null);
				tip.hide(d);
			});
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
		this.d3Labels.enter().append('text');
		this.d3Labels.text((d: any) => Utils.getFileExtension(d.name).slice(0, 4))
			.attr('x', (d) => d.x + this.nodeWidth/2)
			.attr('y', (d) => d.y + this.nodeHeight/2 + this.fontSize / 4)
			.attr('font-size', this.fontSize + 'px').attr('fill','black').attr('text-anchor', 'middle')
			.style('pointer-events', 'none')
			.attr('opacity', (d) => this.getOpacityForDataset(d.dataset));
	}

	renderLinks() {
		//building the arrows for the link end
		this.d3LinksDefsGroup.selectAll('marker').data(['end']).enter().append('marker')
			.attr('id', String)
			.attr('viewBox','-7 -7 14 14')
			.attr('refX', 6)
			.attr('refY', 0)
			.attr('markerWidth', 7)
			.attr('markerHeight', 7)
			.attr('orient','auto')
			.append('path').attr('d', 'M 0,0 m -7,-7 L 7,0 L -7,7 Z')
			.style('fill','#555');

		//Define the xy positions of the link
		this.d3Links = this.d3LinksGroup.selectAll('line').data(this.links);
		// add new lines, but throw away the "enter" selection
		this.d3Links.enter().append('line');
		// update also the old lines (for example when dragging dataset)
		this.d3Links
			.attr('x1', (d) => d.source.x + this.nodeWidth/2)
			.attr('y1', (d) => d.source.y + this.nodeHeight)
			.attr('x2', (d) => d.target.x + this.nodeWidth/2)
			.attr('y2', (d) => d.target.y)
			.attr('opacity', () => WorkflowGraphController.getOpacity(!this.filter))
			.style('marker-end','url(#end)');
	}


	//Function to describe drag behavior
	dragNodes(dx: number, dy: number) {

		this.d3DatasetNodes
			.filter((d: DatasetNode) => this.isSelectedDataset(d.dataset))
			.attr('x', (d) => d.x += dx)
			.attr('y', (d) => d.y += dy);

		this.d3Labels
			.filter((d) => this.isSelectedDataset(d.dataset))
			.attr('x', (d) => d.x + dx + this.nodeWidth/2)
			.attr('y', (d) => d.y + dy + this.nodeHeight/2 + this.fontSize / 4);

		this.d3Links
			.filter((d) => this.isSelectedDataset(d.source.dataset))
			.attr('x1', (d) => d.source.x + this.nodeWidth/2)
			.attr('y1', (d) => d.source.y + this.nodeHeight);

		this.d3Links
			.filter((d) => this.isSelectedDataset((<DatasetNode>d.target).dataset))
			.attr('x2', (d) => d.target.x + this.nodeWidth/2)
			.attr('y2', (d) => d.target.y);
	}

	dragEnd() {

		// update positions of all selected datasets to the server
		this.d3DatasetNodes
			.filter((d) => { return this.isSelectedDataset(d.dataset);})
			.each((d) => {
				if (d.dataset) {
					d.dataset.x = d.x;
					d.dataset.y = d.y;
					this.callback.updateDataset(d.dataset);
				}
			});
	}

	defineRightClickMenu(){

		this.menu=[{title:'Visualize', action: () => {
                this.callback.showDefaultVisualization();
            }},
			{title:'Rename',action:function(elm: any,d: DatasetNode){
				this.callback.renameDatasetDialog(d.dataset);
			}},
			{title:'Delete', action: () => {
				this.callback.deleteDatasets(this.callback.selectedDatasets);
			}},
			{title:'Export', action: () => {
				this.callback.exportDatasets(this.callback.selectedDatasets);
			}},
			{title:'View History as text', action: () => {
				this.callback.openDatasetHistoryModal();
			}}
		];
	}

	renderGraph() {

		if (!this.datasetNodes || !this.jobNodes || !this.links) {
			this.update();
		}

		//Rendering the graph elements
		if (this.enabled) {
			this.defineRightClickMenu();
		}

		this.renderLinks();
		this.renderDatasets();
		this.renderLabels();
		this.renderJobs();

		/*
		function keydown() {
			shiftKey = d3.event.shiftKey
				|| d3.event.metaKey;
			ctrlKey = d3.event.ctrlKey;

			if (d3.event.keyCode == 67) {
				//the c key
			}

			if (shiftKey) {
				svg_graph.call(zoomer).on('mousedown.zoom', null).on('touchstart.zoom', null)
					.on('touchmove.zoom', null).on('touchend.zoom', null);

				vis.selectAll('g.gnode').on('mousedown.drag', null);
			}
		}

		function keyup() {
			shiftKey = d3.event.shiftKey
				|| d3.event.metaKey;
			ctrlKey = d3.event.ctrlKey;
			svg_graph.call(zoomer);
		}
		*/

	}

	zoomAndPan() {

		let event  = <d3.ZoomEvent>this.d3.event;

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

		// transform the view
		this.svg.attr('transform', 'translate('
			+ [tx, ty] + ')'
			+ 'scale(' + event.scale + ')');
	}

	createShadowFilter() {
		// hover shadows inspired bys
		// http://bl.ocks.org/cpbotha/5200394

		// create filter with id #drop-shadow
		// height=130% so that the shadow is not clipped
		var filter = this.svg.append("defs").append("filter")
			.attr("id", "drop-shadow")
			.attr("x", "-50%")
			.attr("y", "-50%")
			.attr("height", "200%")
			.attr("width", "200%");

		// SourceAlpha refers to opacity of graphic that this filter will be applied to
		// convolve that with a Gaussian with standard deviation 3 and store result
		// in blur
		filter.append("feGaussianBlur")
			// black and white
			//.attr("in", "SourceAlpha")
			.attr("in", "SourceGraphic")
			.attr("stdDeviation", 3)
			.attr("result", "blur");

		// translate output of Gaussian blur to the right and downwards with 2px
		// store result in offsetBlur
		filter.append("feOffset")
			.attr("in", "blur")
			.attr("result", "offsetBlur");

		// overlay original SourceGraphic over translated blurred opacity by using
		// feMerge filter. Order of specifying inputs is important!
		var feMerge = filter.append("feMerge");

		feMerge.append("feMergeNode").attr("in", "offsetBlur");
		feMerge.append("feMergeNode").attr("in", "SourceGraphic");
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

			datasetNodes.push(<DatasetNode>{
				x: dataset.x,
				y: dataset.y,
				name: dataset.name,
				extension: Utils.getFileExtension(dataset.name),
				sourceJob: sourceJob,
				color: color,
				dataset: dataset
			});
		});

		return datasetNodes;
	}

	getJobNodes(jobsMap: Map<string, Job>) {

		var jobNodes: JobNode[] = [];
		jobsMap.forEach( (job) => {
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


}

export default {
	controller: WorkflowGraphController,
	template: '<div id="workflow-container" class="fill"></div>',
	bindings: {
		datasetsMap: '<',
		jobsMap: '<',
		modulesMap: '<',
		selectedDatasets: '<',
		selectedJobs: '<',
		datasetSearch: '<',
		callback: '<',
		zoom: '<',
		enabled: '<'
	}
}