import Utils from "../../../../services/utils.service";
import IWindowService = angular.IWindowService;
import WorkflowGraphService from "./workflowgraph.service";
import IScope = angular.IScope;
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Module from "../../../../model/session/module";
import Node from "./node.ts"

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

	static $inject = ['$scope', '$window'];

	constructor(
		private $scope: IScope,
		private $window: IWindowService) {

		this.init();
	}


	wd3:any = this.$window.d3;
	//var shiftKey, ctrlKey;
	svg: any;
	d3Links:any;
	d3Labels:any;
	vis:any;
	menu:any;
	d3JobNodes:any;
	graph:any;
	nodeWidth:number = WorkflowGraphService.nodeWidth;
	nodeHeight:number = WorkflowGraphService.nodeHeight;
	fontSize = 14;
	nodeRadius = 4;
	width:number;
	height:number;
	svgDatasetNodes:any;
	lastScale: number;

	datasetsMap: Map<string, Dataset>;
	jobsMap: Map<string, Job>;
	modulesMap: Map<string, Module>;
	selectedDatasets: {};
	callback: any;
	zoom: number;
	enabled: boolean;
	dragStarted: boolean;

	init() {

		this.$scope.$on('resizeWorkFlowGraph', this.renderGraph);

		//Method for search data file in the workflow graph
		this.$scope.$on('searchDatasets', (event:any, data:any) => {
			if (this.graph) {
				if (data.data) {
					this.graph.filter = Utils.arrayToMap(data.data, 'datasetId');
				} else {
					this.graph.filter = null;
				}
				this.renderGraph();
			}
		});

		this.$scope.$watch(() => this.selectedDatasets, () => {
			if (this.graph) {
				this.renderGraph();
			}
		}, true);

		this.$scope.$watchGroup([() => this.datasetsMap, () => this.jobsMap, () => this.modulesMap], () => {
			this.update();
		}, true);
	}

	update() {

		var datasetNodes = this.getDatasetNodes(this.datasetsMap, this.jobsMap, this.modulesMap);
		var jobNodes = this.getJobNodes(this.jobsMap);

		// Add datasets before jobs, because the layout will be done in this order.
		// Jobs should make space for the datasets in the layout, because
		// the jobs are only temporary.
		var allNodes: Node[] = [];

		datasetNodes.forEach((n: Node) => allNodes.push(n));
		jobNodes.forEach((n: Node) => allNodes.push(n));

		var links = this.getLinks(allNodes);

		this.doLayout(links, allNodes);

		this.graph = {
			nodes: datasetNodes,
			jobNodes: jobNodes,
			links: links
		};
		this.renderGraph();
	}

	renderJobs() {

		var arc = this.wd3.svg.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);

		this.d3JobNodes = this.vis.append('g').attr('class', 'node').selectAll('rect');

		var self = this;

		// create a box for each job
		var rect = this.d3JobNodes.data(this.graph.jobNodes).enter().append('rect')
			.attr('rx', this.nodeRadius)
			.attr('ry', this.nodeRadius)
			.attr('width', this.nodeWidth)
			.attr('height', this.nodeHeight)
			.attr('transform', (d: Node) => 'translate(' + d.x + ',' + d.y + ')')
			.style('fill', (d: Node, i:number) => d.color)
			//.style('fill', (d: Node, i:number) => this.getGradient(d, 'job' + i))
			.on('click', (d: JobNode) => {
				if (!this.enabled) {
					return;
				}
				this.$scope.$apply(this.callback.selectJob(this.wd3.event, d.job));
			})
			.on('mouseover', function () {
				self.wd3.select(this).style('filter', 'url(#drop-shadow)');
			})
			.on('mouseout', function () {
				self.wd3.select(this).style('filter', null);
			});

		// highlight selected datasets
		rect.each(function (d:any) {
			self.wd3.select(this).classed('selected', self.enabled && self.callback.isSelectedJob(d.job));
		});

		// create an arc for each job
		this.d3JobNodes.data(this.graph.jobNodes).enter().append('path')
			.style('fill', (d:JobNode) => d.fgColor)
			.style('stroke-width', 0)
			.attr('opacity', 0.5)
			.style('pointer-events', 'none')
			.attr('d', arc)
			.call(this.spin.bind(this), 3000);
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
					return this.wd3.interpolateString(
						'translate(' + x + ',' + y + ')rotate(0)',
						'translate(' + x + ',' + y + ')rotate(360)'
					);
				} else {
					return this.wd3.interpolateString(
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

	renderBackground() {

		// invisible rect for listening background clicks
		this.vis.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', this.width)
			.attr('height', this.height)
			.attr('opacity', 0)
			.on('click', () => {
				if (!this.enabled) {
					return;
				}
				this.$scope.$apply(this.callback.clearSelection());
			});
	}

	renderNodes(){

		this.svgDatasetNodes = this.vis.append('g').attr('class', 'node').selectAll('rect');

		var tip = this.wd3.tip()
			.attr('class','d3-tip')
			.offset([-10,0]).html((d: DatasetNode) => d.name+'');

		this.svg.call(tip);

		var self = this;

		//Drawing the nodes in the SVG
		this.svgDatasetNodes = this.svgDatasetNodes.data(this.graph.nodes).enter().append('rect')
			.attr('x', (d: Node) => d.x )
			.attr('y', (d: Node) => d.y )
			.attr('rx', this.nodeRadius)
			.attr('ry', this.nodeRadius)
			.attr('width', this.nodeWidth)
			.attr('height', this.nodeHeight)
			//FIXME
			//.style("fill", this.getGradient.bind(this))
			.style("fill", (d: Node) => d.color)
			//.style('filter', 'url(#drop-shadow)')
			.attr('opacity', (d: DatasetNode) => this.getOpacityForDataset(d.dataset))
			.on('dblclick', () => {
				if (!this.enabled) {
					return;
				}
				this.callback.showDefaultVisualization();
			})
			.on('click', (d: DatasetNode) => {
				if (!this.enabled) {
					return;
				}
				this.$scope.$apply(() => {
					if (!Utils.isCtrlKey(this.wd3.event)) {
						this.callback.clearSelection();
					}
					this.callback.toggleDatasetSelection(this.wd3.event, d.dataset);
				});
				tip.hide(d);
			})
			.call(this.wd3.behavior.drag()
				.on('drag',() => {
					if (!this.enabled) {
						return;
					}
					this.dragStarted = true;
					this.dragNodes(this.wd3.event.dx, this.wd3.event.dy);
					// set defaultPrevented flag to disable scrolling
					this.wd3.event.sourceEvent.preventDefault();
				})
				.on('dragend', () => {
					// check the flag to differentiate between drag and click events
					if (this.dragStarted) {
						this.dragStarted = false;
						this.dragEnd();
					}
				})
			)
			.on('contextmenu', this.wd3.contextMenu(this.menu).bind(this))
			.on('mouseover', function(d: Node) {
				if (!self.enabled) {
					return;
				}
				// how to get the current element without select(this) so that we can bind(this)
				// and get rid of 'self'
				self.wd3.select(this).style('filter', 'url(#drop-shadow)');
				tip.show(d);
			})
			.on('mouseout', function(d: Node) {
				if (!self.enabled) {
					return;
				}
				self.wd3.select(this).style('filter', null);
				tip.hide(d);
			});

		// highlight selected datasets
		this.svgDatasetNodes.each(function(d: DatasetNode) {
			self.wd3.select(this).classed('selected', self.enabled && self.callback.isSelectedDataset(d.dataset));
		});
	}

	getOpacityForDataset(d: Dataset) {
		return this.getOpacity(!this.graph.filter || this.graph.filter.has(d.datasetId));
	}

	getOpacity(isVisible: boolean) {
		if (isVisible) {
			return 1.0;
		} else {
			return 0.25;
		}
	}

	renderLabels(){

		this.d3Labels = this.vis.append('g').selectAll('text').data(this.graph.nodes).enter()
			.append('text').text((d: any) => Utils.getFileExtension(d.name).slice(0, 4))
			.attr('x', (d: Node) => d.x + this.nodeWidth/2)
			.attr('y', (d: Node) => d.y + this.nodeHeight/2 + this.fontSize / 4)
			.attr('font-size', this.fontSize + 'px').attr('fill','black').attr('text-anchor', 'middle')
			.style('pointer-events', 'none')
			.attr('opacity', (d: DatasetNode) => this.getOpacityForDataset(d.dataset));
	}

	renderLinks() {
		//defining links
		this.d3Links = this.vis.append('g').attr('class', 'link').selectAll('line');

		//building the arrows for the link end
		this.vis.append('defs').selectAll('marker').data(['end']).enter().append('marker')
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
		this.d3Links = this.d3Links.data(this.graph.links).enter().append('line')
			.attr('x1', (d: Node) => d.source.x + this.nodeWidth/2)
			.attr('y1', (d: Node) => d.source.y + this.nodeHeight)
			.attr('x2', (d: Node) => d.target.x + this.nodeWidth/2)
			.attr('y2', (d: Node) => d.target.y)
			.attr('opacity', () => this.getOpacity(!this.graph.filter))
			.style('marker-end','url(#end)');
	}


	//Function to describe drag behavior
	dragNodes(dx: number, dy: number) {

		this.svgDatasetNodes
			.filter((d: DatasetNode) => this.callback.isSelectedDataset(d.dataset))
			.attr('x', (d: Node) => d.x += dx)
			.attr('y', (d: Node) => d.y += dy);

		this.d3Labels
			.filter((d: DatasetNode) => this.callback.isSelectedDataset(d.dataset))
			.attr('x', (d: Node) => d.x + dx + this.nodeWidth/2)
			.attr('y', (d: Node) => d.y + dy + this.nodeHeight/2 + this.fontSize / 4);

		this.d3Links
			.filter((d: Link) => this.callback.isSelectedDataset(d.source.dataset))
			.attr('x1', (d: Node) => d.source.x + this.nodeWidth/2)
			.attr('y1', (d: Node) => d.source.y + this.nodeHeight);

		this.d3Links
			.filter((d: Link) => this.callback.isSelectedDataset((<DatasetNode>d.target).dataset))
			.attr('x2', (d: Node) => d.target.x + this.nodeWidth/2)
			.attr('y2', (d: Node) => d.target.y);
	}

	dragEnd() {

		// update positions of all selected datasets to the server
		this.svgDatasetNodes
			.filter((d: DatasetNode) => { return this.callback.isSelectedDataset(d.dataset);})
			.each((d: DatasetNode) => {
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

		var element = document.getElementById('workflow-container');

		this.width = this.graph.width = Math.max(200, element.offsetWidth);
		this.height = this.graph.height = Math.max(200, element.offsetHeight);
		this.wd3.select('svg').remove();

		var xScale = this.wd3.scale.linear().domain([ 0, this.width ]).range([0, this.width ]);
		var yScale = this.wd3.scale.linear().domain([ 0, this.height ]).range([ 0, this.height ]);

		this.svg = this.wd3.select(element).append('svg').attr('width', this.width).attr('height', this.height);

		var zoomer = this.wd3.behavior.zoom().scaleExtent([ 0.2, 1 ]).x(xScale).y(yScale).on('zoom', this.redraw.bind(this));

		var svg_graph = this.svg.append('svg:g').call(zoomer);

		var rect = svg_graph.append('svg:rect').attr('width', this.width).attr('height', this.height)
			.attr('fill', 'transparent');

		this.vis = svg_graph.append('svg:g');

		zoomer.scale(this.zoom);
		zoomer.event(this.svg);

		//Rendering the graph elements

		this.createShadowFilter();
		this.renderBackground();
		if (this.enabled) {
			this.defineRightClickMenu();
		}

		this.renderLinks();
		this.renderNodes();
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

	redraw() {

		// allow default zoom level to be set even when disabled
		if (!this.enabled && this.wd3.event.scale !== this.zoom) {
			return;
		}

		// let zoom events go through, because those have always defaultPrevented === true
		if (this.wd3.event.scale === this.lastScale) {
			// disable scrolling when dragging nodes
			if (this.wd3.event.sourceEvent && this.wd3.event.sourceEvent.defaultPrevented) {
				return;
			}
		}
		this.lastScale = this.wd3.event.scale;

		// prevent scrolling over the top and left edges
		this.wd3.event.translate[0] = Math.min(0, this.wd3.event.translate[0]);
		this.wd3.event.translate[1] = Math.min(0, this.wd3.event.translate[1]);

		this.vis.attr('transform', 'translate('
			+ this.wd3.event.translate + ')'
			+ 'scale(' + this.wd3.event.scale + ')');
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

	getGradient(d: Node, i: string) {

		var gradient = this.vis.append("defs")
			//.selectAll('linearGradient').data(graph.nodes).enter()
			.append("linearGradient")
			// separate gradient def for each data item
			.attr("id", "gradient" + i)
			// show only half of the gradient
			// gradient is visible only from 0%, but this way we can fade to white and
			// don't have to blend colors
			.attr("x1", "-100%")
			.attr("y1", "-100%")
			.attr("x2", "100%")
			.attr("y2", "100%")
			.attr("spreadMethod", "pad");

		gradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", 'white')
			.attr("stop-opacity", 1);

		gradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", () => d.color)
			.attr("stop-opacity", 1);

		return 'url(#gradient' + i + ')';
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
		jobsMap.forEach( (job: Job) => {
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
		links.forEach((link: Link) => {
			if (!link.target.x || !link.target.y) {
				var pos = WorkflowGraphService.newPosition(nodes, link.source.x, link.source.y);
				link.target.x = pos.x;
				link.target.y = pos.y;
			}
		});

		// layout orphan nodes
		nodes.forEach((node: Node) => {
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
		datasetsMap: '=',
		jobsMap: '=',
		modulesMap: '=',
		selectedDatasets: '=',
		callback: '=',
		zoom: '=',
		enabled: '='
	}
}