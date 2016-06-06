
angular.module('chipster-web').directive('workflowGraph',function($window, WorkflowGraphService, Utils) {
	return {
		restrict : 'EA',
		require:'^ngController',
		scope: {
			datasetsMap: '=datasetsMap',
			jobsMap: '=jobsMap',
			modulesMap: '=modulesMap',
			callback: '=callback',
			zoom: '=zoom',
			enabled: '=enabled'
		},
		template: '<div id="workflow-container" class="fill"></div>',

		link : function(scope) {
			var d3 = $window.d3;
			//var shiftKey, ctrlKey;
			var svg, d3Links, d3Labels, vis, menu, d3JobNodes;
			var graph;
			var nodeWidth=WorkflowGraphService.nodeWidth;
			var nodeHeight=WorkflowGraphService.nodeHeight;
			var fontSize = 14;
			var nodeRadius = 4;

			scope.$on('resizeWorkFlowGraph', scope.renderGraph);

			//Method for search data file in the workflow graph
			scope.$on('searchDatasets', function(event,data){
				if (graph) {
					if (data.data) {
						graph.filter = Utils.arrayToMap(data.data, 'datasetId');
					} else {
						graph.filter = null;
					}
					renderGraph();
				}
			});

			scope.$watch('selectedDatasets', function () {
				if (graph) {
					renderGraph();
				}
			}, true);

			scope.$on('datasetsMapChanged', function () {
				scope.update();
			});

			scope.$on('jobsMapChanged', function () {
				scope.update();
			});

			//scope.$watchGroup(['session.datasetsMap', 'session.jobsMap', 'modulesMap'], function () {
			scope.$watchGroup(['datasetsMap', 'jobsMap', 'modulesMap'], function () {
				// this will notice only the initial loading
				scope.update();
			}, true);

			scope.update = function() {

				var datasetNodes = scope.getDatasetNodes(scope.datasetsMap, scope.jobsMap, scope.modulesMap);
				var jobNodes = scope.getJobNodes(scope.jobsMap);


				// add datasets before jobs, because the layout will be done in this order
				// jobs should make space for the datasets in the layout, because
				// the jobs are only temporary
				var allNodes = [];

				angular.forEach(datasetNodes, function(n) {
					allNodes.push(n);
				});

				angular.forEach(jobNodes, function(n) {
					allNodes.push(n);
				});

				var links = scope.getLinks(allNodes);

				scope.doLayout(links, allNodes);

				graph = {
					nodes: datasetNodes,
					jobNodes: jobNodes,
					links: links
				};
				renderGraph();
			};

			function renderJobs() {

				var arc=d3.svg.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75*2*Math.PI);

				d3JobNodes=vis.append('g').attr('class', 'node').selectAll('rect');

				// create a box for each job
				var rect=d3JobNodes.data(graph.jobNodes).enter().append('rect')
					.attr('rx', nodeRadius)
					.attr('ry', nodeRadius)
					.attr('width',nodeWidth)
					.attr('height',nodeHeight)
					.attr('transform', function(d) {
						return 'translate(' + d.x + ',' + d.y + ')'
					})
					.style('fill', function(d, i) {
						return getGradient(d, 'job'+i);
					})
					.on('click',function(d) {
						if (!scope.enabled) {
							return;
						}
						scope.$apply(function() {
							scope.callback.selectJob(d3.event, d.job);
						});
					})
					.on('mouseover', function() {
						d3.select(this).style('filter', 'url(#drop-shadow)');
					})
					.on('mouseout', function() {
						d3.select(this).style('filter', null);
					});

				// highlight selected datasets
				rect.each(function(d) {
					d3.select(this).classed('selected', scope.enabled && scope.callback.isSelectedJob(d.job));
				});

				// create an arc for each job
				d3JobNodes.data(graph.jobNodes).enter().append('path')
					.style('fill', function(d) {
						return d.fgColor;
					})
					.style('stroke-width', 0)
					.attr('opacity', 0.5)
					.style('pointer-events', 'none')
					.attr('d', arc)
					.call(spin, 3000);

				function spin(selection,duration){

					// first round
					selection
						.transition()
						.ease('linear')
						.duration(duration)
						.attrTween('transform', function(d) {

							var x = d.x + nodeWidth / 2;
							var y = d.y + nodeHeight / 2;

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
					setTimeout(function () {
						spin(selection, duration);
					}, duration);
				}
			}

			function renderBackground() {

				// invisible rect for listening background clicks
				vis.append('rect')
					.attr('x', 0)
					.attr('y', 0)
					.attr('width', width)
					.attr('height', height)
					.attr('opacity', 0)
					.on('click', function() {
						if (!scope.enabled) {
							return;
						}
						scope.$apply(function() {
							scope.callback.clearSelection();
						});
					});
			}

			function renderNodes(){

				svgDatasetNodes = vis.append('g').attr('class', 'node').selectAll('rect');

				var tip=d3.tip().attr('class','d3-tip').offset([-10,0]).html(function(d){return d.name+'';});
				svg.call(tip);


				//Drawing the nodes in the SVG
				svgDatasetNodes = svgDatasetNodes.data(graph.nodes).enter().append('rect')
					.attr('x', function(d) {return d.x;})
					.attr('y', function(d) {return d.y;})
					.attr('rx', nodeRadius)
					.attr('ry', nodeRadius)
					.attr('width',nodeWidth).attr('height',nodeHeight)
					.style("fill", getGradient)
					//.style('filter', 'url(#drop-shadow)')
					.attr('opacity', function (d) {
						return getOpacityForDataset(d.dataset);
					})
					.on('dblclick', function() {
						if (!scope.enabled) {
							return;
						}
						scope.callback.showDefaultVisualization();
					})
					.on('click',function(d) {
						if (!scope.enabled) {
							return;
						}
						scope.$apply(function() {
							if (!Utils.isCtrlKey(d3.event)) {
								scope.callback.clearSelection();
							}
							scope.callback.toggleDatasetSelection(d3.event, d.dataset);
						});
						tip.hide(d);
					})
					.call(d3.behavior.drag()
						.on('drag',function() {
							if (!scope.enabled) {
								return;
							}
							scope.dragStarted = true;
							dragNodes(d3.event.dx,d3.event.dy);
							// set defaultPrevented flag to disable scrolling
							d3.event.sourceEvent.preventDefault();
						})
						.on('dragend', function () {
							// check the flag to differentiate between drag and click events
							if (scope.dragStarted) {
								scope.dragStarted = false;
								dragEnd();
							}
						})
					)
					.on('contextmenu',d3.contextMenu(menu))
					.on('mouseover', function(d) {
						if (!scope.enabled) {
							return;
						}
						d3.select(this).style('filter', 'url(#drop-shadow)');
						tip.show(d);
					})
					.on('mouseout', function(d) {
						if (!scope.enabled) {
							return;
						}
						d3.select(this).style('filter', null);
						tip.hide(d);
					});

				// highlight selected datasets
				svgDatasetNodes.each(function(d) {
					d3.select(this).classed('selected', scope.enabled && scope.callback.isSelectedDataset(d.dataset));
				});
			}

			function getOpacityForDataset(d) {
				return getOpacity(!graph.filter || graph.filter.has(d.datasetId));
			}

			function getOpacity(isVisible) {
				if (isVisible) {
					return 1.0;
				} else {
					return 0.25;
				}
			}

			function renderLabels(){

				d3Labels=vis.append('g').selectAll('text').data(graph.nodes).enter()
					.append('text').text(function(d){
						return Utils.getFileExtension(d.name).slice(0, 4);
					})
					.attr('x',function(d){return d.x+nodeWidth/2;})
					.attr('y',function(d){return d.y+nodeHeight/2 + fontSize / 4;})
					.attr('font-size', fontSize + 'px').attr('fill','black').attr('text-anchor', 'middle')
					.style('pointer-events', 'none')
					.attr('opacity', function (d) {
						return getOpacityForDataset(d.dataset);
					});
			}

			function renderLinks(){
				//defining links
				d3Links = vis.append('g').attr('class', 'link').selectAll('line');

				//building the arrows for the link end
				vis.append('defs').selectAll('marker').data(['end']).enter().append('marker')
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
				d3Links = d3Links.data(graph.links).enter().append('line')
					.attr('x1', function(d) {return d.source.x + nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y + nodeHeight;})
					.attr('x2', function(d) {return d.target.x + nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;})
					.attr('opacity', function () {
						return getOpacity(!graph.filter);
					})
					.style('marker-end','url(#end)');
			}


			//Function to describe drag behavior
			function dragNodes(dx, dy) {

				svgDatasetNodes.filter(function(d) {return scope.callback.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x += dx;})
					.attr('y', function(d) {return d.y += dy;});

				d3Labels.filter(function(d) {return scope.callback.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x+dx+nodeWidth/2;})
					.attr('y', function(d) {return d.y+dy+nodeHeight/2 +  + fontSize / 4;});

				d3Links.filter(function(d) {return scope.callback.isSelectedDataset(d.source.dataset)})
					.attr('x1', function(d) {return d.source.x+nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y + nodeHeight;});

				d3Links.filter(function(d) {return scope.callback.isSelectedDataset(d.target.dataset)})
					.attr('x2', function(d) {return d.target.x+nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;});
			}

			function dragEnd() {

				// update positions of all selected datasets to the server
				svgDatasetNodes.filter(function(d) {
					return scope.callback.isSelectedDataset(d.dataset);

				}).each(function(d) {
					if (d.dataset) {
						d.dataset.x = d.x;
						d.dataset.y = d.y;
						scope.callback.updateDataset(d.dataset);
					}
				});
			}

			function defineRightClickMenu(){

				menu=[{title:'Visualize',action: function(){
					scope.callback.showDefaultVisualization();
				}},
					{title:'Rename',action:function(elm,d){
						scope.callback.renameDatasetDialog(d.dataset);
					}},
					{title:'Delete',action:function(){
						scope.callback.deleteDatasets(scope.callback.selectedDatasets);
					}},
					{title:'Export',action:function(){
						scope.callback.exportDatasets(scope.callback.selectedDatasets);
					}},
					{title:'View History as text',action:function(){
						scope.callback.showHistory();
					}}
				] ;
			}

			function renderGraph() {

				var element = document.getElementById('workflow-container');

				width = graph.width = Math.max(200, element.offsetWidth);
				height = graph.height = Math.max(200, element.offsetHeight);
				d3.select('svg').remove();

				var xScale = d3.scale.linear().domain([ 0, width ]).range([0, width ]);
				var yScale = d3.scale.linear().domain([ 0, height ]).range([ 0, height ]);

				svg = d3.select(element).append('svg').attr('width', width).attr('height', height);

				var zoomer = d3.behavior.zoom().scaleExtent([ 0.2, 1 ]).x(xScale).y(yScale).on('zoom',redraw);

				var lastScale = null;

				function redraw() {

					// allow default zoom level to be set even when disabled
					if (!scope.enabled && d3.event.scale !== scope.zoom) {
						return;
					}

					// let zoom events go through, because those have always defaultPrevented === true
					if (d3.event.scale === lastScale) {
						// disable scrolling when dragging nodes
						if (d3.event.sourceEvent && d3.event.sourceEvent.defaultPrevented) {
							return;
						}
					}
					lastScale = d3.event.scale;

					// prevent scrolling over the top and left edges
					d3.event.translate[0] = Math.min(0, d3.event.translate[0]);
					d3.event.translate[1] = Math.min(0, d3.event.translate[1]);

					vis.attr('transform', 'translate('
						+ d3.event.translate + ')'
						+ 'scale(' + d3.event.scale + ')');
				}

				var svg_graph = svg.append('svg:g').call(zoomer);

				var rect = svg_graph.append('svg:rect').attr('width', width).attr('height', height)
					.attr('fill', 'transparent');

				vis = svg_graph.append('svg:g');

				zoomer.scale(scope.zoom);
				zoomer.event(svg);

				//Rendering the graph elements

				createShadowFilter();
				renderBackground();
				if (scope.enabled) {
					defineRightClickMenu();
				}
				renderLinks();
				renderNodes();
				renderLabels();
				renderJobs();

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

			}//end of renderGraph

			function createShadowFilter() {
				// hover shadows inspired bys
				// http://bl.ocks.org/cpbotha/5200394

				// create filter with id #drop-shadow
				// height=130% so that the shadow is not clipped
				var filter = svg.append("defs").append("filter")
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

			function getGradient(d, i) {
				var gradient = vis.append("defs")
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
					.attr("stop-color", function() {
						return 'white';
						//return d.color;
					})
					.attr("stop-opacity", 1);

				gradient.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", function() {
						return d.color;
					})
					.attr("stop-opacity", 1);

				return 'url(#gradient' + i + ')';
			}

			scope.getDatasetNodes = function(datasetsMap, jobsMap, modulesMap) {

				var datasetNodes = [];
				datasetsMap.forEach(function (dataset) {

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

					datasetNodes.push({
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
			};

			scope.getJobNodes = function(jobsMap) {

				var jobNodes = [];
				jobsMap.forEach( function(job) {
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

						jobNodes.push({
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
			};

			scope.getLinks = function(nodes) {

				var links = [];

				// map for searching source
				var datasetNodesMap = new Map();
				angular.forEach(nodes, function(node) {
					if (node.dataset) {
						datasetNodesMap.set(node.dataset.datasetId, node);
					}
				});

				angular.forEach(nodes, function (targetNode) {
					if (targetNode.sourceJob) {
						var sourceJob = targetNode.sourceJob;
						// iterate over the inputs of the source job
						sourceJob.inputs.forEach(function (input) {
							var sourceNode = datasetNodesMap.get(input.datasetId);
							if (sourceNode && targetNode) {
								links.push({
									source: sourceNode,
									target: targetNode
								});
							}
						});
					}
				});

				return links;
			};

			scope.doLayout = function(links, nodes) {

				// layout nodes that don't yet have a position

				// layout nodes with parents (assumes that a parent precedes its childrens in the array)
				angular.forEach(links, function(link) {
					if (!link.target.x || !link.target.y) {
						var pos = WorkflowGraphService.newPosition(nodes, link.source.x, link.source.y);
						link.target.x = pos.x;
						link.target.y = pos.y;
					}
				});

				// layout orphan nodes
				angular.forEach(nodes, function(node) {
					if (!node.x || !node.y) {
						var pos = WorkflowGraphService.newRootPosition(nodes);
						node.x = pos.x;
						node.y = pos.y;
					}
				});
			}

		}//end of link function

	};//end of return

});