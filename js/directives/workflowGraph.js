/**
 * @desc workflowGraphLayout directive that creates the workflow graph for session dataset 'd3Data'
 * @example <div><workflow-graph-layout data='d3Data'></div>
 */
chipsterWeb.directive('workflowGraph',function($window, WorkflowGraphService, Utils) {
	return {
		restrict : 'EA',
		require:'^ngController',

		link : function(scope, iElement) {
			var d3 = $window.d3;
			//var shiftKey, ctrlKey;
			var svg, d3Links, d3Labels, vis, menu, d3JobNodes;
			var graph;
			var nodeWidth=WorkflowGraphService.nodeWidth;
			var nodeHeight=WorkflowGraphService.nodeHeight;

			scope.$on('resizeWorkFlowGraph', scope.renderGraph);

			//Method for search data file in the workflow graph
			scope.$on('searchDatasets', function(event,data){
				if (graph) {
					graph.filter = Utils.arrayToMap(data.data, 'datasetId');
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

			scope.$watchGroup(['session.datasetsMap', 'session.jobsMap', 'modulesMap'], function () {
				// this will notice only the initial loading
				scope.update();
			}, true);

			scope.update = function() {

				var datasetNodes = scope.getDatasetNodes(scope.session.datasetsMap, scope.session.jobsMap, scope.modulesMap);
				var jobNodes = scope.getJobNodes(scope.session.jobsMap);


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

				var arc=d3.svg.arc().innerRadius(8).outerRadius(12).startAngle(0).endAngle(0.75*2*Math.PI);

				d3JobNodes=vis.append('g').attr('class', 'job').selectAll('rect');

				// create a box for each job
				var rect=d3JobNodes.data(graph.jobNodes).enter().append('rect')
					.attr('rx', 6)
					.attr('ry', 6)
					.attr('width',nodeWidth)
					.attr('height',nodeHeight)
					.attr('transform', function(d) {
						return 'translate(' + d.x + ',' + d.y + ')'
					})
					.style('fill', function(d) {
						return d.bgColor;
					})
					.on('click',function(d) {
						scope.$apply(function() {
							scope.selectJob(d3.event, d.job);
						});
					});
					//.style('stroke', 'black')
					//.style('stroke-width', 1);

				// create an arc for each job
				d3JobNodes.data(graph.jobNodes).enter().append('path')
					.style('fill', function(d) {
						return d.color;
					})
					.attr('opacity', 0.5)
					.style('pointer-events', 'none')
					.attr('d', arc)
					.call(spin, 1500);

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
						scope.$apply(function() {
							scope.clearDatasetSelection();
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
					.attr('rx', 6)
					.attr('ry', 6)
					.attr('width',nodeWidth).attr('height',nodeHeight)
					.attr('fill', function(d) {
						return d.color;
					})
					.attr('opacity', function(d) {
						if (!graph.filter || graph.filter.has(d.dataset.datasetId)) {
							return 1.0;
						} else {
							return 0.25;
						}
					})
					.on('dblclick', scope.showDefaultVisualization)
					.on('click',function(d) {
						scope.$apply(function() {
							scope.toggleDatasetSelection(d3.event, d.dataset);
						});

						tip.hide(d);
					})
					.call(d3.behavior.drag()
						.on('drag',function() {
							dragNodes(d3.event.dx,d3.event.dy);
							// set defaultPrevented flag to disable scrolling
							d3.event.sourceEvent.preventDefault();
						})
						.on('dragend', dragEnd)
					)
					.on('contextmenu',d3.contextMenu(menu))
					.on('mouseover',tip.show)
					.on('mouseout',tip.hide);

				// highlight selected datasets
				svgDatasetNodes.each(function(d) {
					d3.select(this).classed('selected', scope.isSelectedDataset(d.dataset));
				});
			}

			function renderLabels(){
				var fontSize = 12;
				d3Labels=vis.append('g').selectAll('text').data(graph.nodes).enter()
					.append('text').text(function(d){return Utils.getFileExtension(d.name);})
					.attr('x',function(d){return d.x+nodeWidth/2;})
					.attr('y',function(d){return d.y+nodeHeight/2 + fontSize / 4;})
					.attr('font-size', fontSize + 'px').attr('fill','black').attr('text-anchor', 'middle')
					.style('pointer-events', 'none')
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
					.style('fill','#999');

				//Define the xy positions of the link
				d3Links = d3Links.data(graph.links).enter().append('line')
					.attr('x1', function(d) {return d.source.x + nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y + nodeHeight;})
					.attr('x2', function(d) {return d.target.x + nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;})
					.style('marker-end','url(#end)');
			}


			//Function to describe drag behavior
			function dragNodes(dx, dy) {

				svgDatasetNodes.filter(function(d) {return scope.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x += dx;})
					.attr('y', function(d) {return d.y += dy;});

				d3Labels.filter(function(d) {return scope.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x+dx+nodeWidth/2;})
					.attr('y', function(d) {return d.y+dy+nodeHeight/2;});

				d3Links.filter(function(d) {return scope.isSelectedDataset(d.source.dataset)})
					.attr('x1', function(d) {return d.source.x+nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y;});

				d3Links.filter(function(d) {return scope.isSelectedDataset(d.target.dataset)})
					.attr('x2', function(d) {return d.target.x+nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;});
			}

			function dragEnd() {
				// update positions of all selected datasets to the server
				svgDatasetNodes.filter(function(d) {
					return scope.isSelectedDataset(d.dataset);

				}).each(function(d) {
					if (d.dataset) {
						d.dataset.x = d.x;
						d.dataset.y = d.y;
						scope.updateDataset(d.dataset);
					}
				});
			}

			function defineRightClickMenu(){

				menu=[{title:'Visualize',action: function(){
					scope.showDefaultVisualization();
				}},
					{title:'Rename',action:function(elm,d){
						scope.renameDatasetDialog(d.dataset);
					}},
					{title:'Delete',action:function(){
						scope.deleteDatasets(scope.selectedDatasets);
					}},
					{title:'Export',action:function(){
						scope.exportDatasets(scope.selectedDatasets);
					}},
					{title:'View History as text',action:function(){
						scope.showHistory();
					}}
				] ;
			}

			function renderGraph() {

				var element = document.getElementById('workflow-dataset-panel');

				width = graph.width = element.offsetWidth - 20;
				height = graph.height = element.offsetHeight - 50;
				d3.select('svg').remove();

				var xScale = d3.scale.linear().domain([ 0, width ]).range([0, width ]);
				var yScale = d3.scale.linear().domain([ 0, height ]).range([ 0, height ]);

				svg = d3.select(iElement[0]).append('svg').attr('width', width).attr('height', height);

				var zoomer = d3.behavior.zoom().scaleExtent([ 0.2, 1 ]).x(xScale).y(yScale).on('zoom',redraw);

				var lastScale = null;

				function redraw() {

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

				//Rendering the graph elements
				renderBackground();
				defineRightClickMenu();
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

						var color = '#4d4ddd';
						var bgColor = 'lightGray';
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
							color: color,
							bgColor: bgColor,
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