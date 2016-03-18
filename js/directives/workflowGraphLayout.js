/**
 * @desc workflowGraphLayout directive that creates the workflow graph for session dataset 'd3Data'
 * @example <div><workflow-graph-layout data='d3Data'></div>
 */
chipsterWeb.directive('workflowGraphLayout',function($window,WorkflowGraphService, Utils) {
	return {
		restrict : 'EA',
		require:'^ngController',

		link : function(scope, iElement) {
			var d3 = $window.d3;
			var width = (window.innerWidth / 2) - 50;
			var height = (window.innerHeight-150);
			var shiftKey, ctrlKey;
			var svg, nodes, link, label, vis, menu, pb_svg;
			var graph;
			var nodeWidth=40,nodeHeight=25;

			scope.$on('resizeWorkFlowGraph',function(event,data){
				width=data.data.width-50;
				renderGraph(width, height);
			});

			//Method for search data file in the workflow graph
			scope.$on('searchDatasets', function(event,data){
				graph.filter = Utils.arrayToMap(data.data, 'datasetId');
				renderGraph(width, height);
			});

			scope.$watch('selectedDatasets', function () {
				if (graph) {
					renderGraph(width, height);
				}
			}, true);

			scope.$watch('session.datasetsMap.size', function () {
				// why the watch below doesn't notice deletions?
				console.log('watch4');
				scope.update();
			});

			scope.$watch('selectedDatasets', function () {
				// why the watch below doesn't notice dataset rename?
				console.log('watch3');
				scope.update();
			}, true);

			scope.$watch('session.jobsMap.size', function () {
				console.log('watch2');
				scope.update();
			});

			scope.$watchGroup(['session.datasetsMap', 'session.jobsMap', 'modulesMap'], function () {
				console.log('watch');
				scope.update();
			}, true);

			scope.update = function() {
				var datasetNodes = scope.getDatasetNodes(scope.session.datasetsMap, scope.session.jobsMap, scope.modulesMap, scope.filter);
				var jobNodes = scope.getJobNodes(scope.session.jobsMap, scope.session.datasetsMap);

				var allNodes = [];
				angular.extend(allNodes, datasetNodes);
				angular.extend(allNodes, jobNodes);

				var links = scope.getLinks(allNodes, scope.session.datasetsMap);

				graph = {
					nodes: datasetNodes,
					jobNodes: jobNodes,
					links: links
				};
				renderGraph(width, height);
			};

			function renderJobs() {

				var arc=d3.svg.arc().innerRadius(8).outerRadius(12).startAngle(0).endAngle(0.75*2*Math.PI);

				pb_svg=vis.append('g').attr('class', 'job').selectAll('rect');

				// create a box for each job
				var rect=pb_svg.data(graph.jobNodes).enter().append('rect')
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
				pb_svg.data(graph.jobNodes).enter().append('path')
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

				nodes = vis.append('g').attr('class', 'node').selectAll('rect');

				var tip=d3.tip().attr('class','d3-tip').offset([-10,0]).html(function(d){return d.name+'';});
				svg.call(tip);

				//Drawing the nodes in the SVG
				nodes = nodes.data(graph.nodes).enter().append('rect')
					.attr('x', function(d) {return d.x;})
					.attr('y', function(d) {return d.y;})
					.attr('rx', 6)
					.attr('ry', 6)
					.attr('width',nodeWidth).attr('height',nodeHeight)
					.attr('fill', function(d) {
						return d.color;
					})
					.attr('opacity', function(d) {
						if (d.filter) {
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
				nodes.each(function(d) {
					d3.select(this).classed('selected', scope.isSelectedDataset(d.dataset));
				});
			}

			function renderLabels(){
				var fontSize = 12;
				label=vis.append('g').selectAll('text').data(graph.nodes).enter()
					.append('text').text(function(d){return Utils.getFileExtension(d.name);})
					.attr('x',function(d){return d.x+nodeWidth/2;})
					.attr('y',function(d){return d.y+nodeHeight/2 + fontSize / 4;})
					.attr('font-size', fontSize + 'px').attr('fill','black').attr('text-anchor', 'middle')
					.style('pointer-events', 'none')
			}

			function renderLinks(){
				//defining links
				link = vis.append('g').attr('class', 'link').selectAll('line');

				//building the arrows for the link end
				vis.append('defs').selectAll('marker').data(['end']).enter().append('marker')
					.attr('id', String).attr('viewBox','0 -5 12 12').attr('refX',12).attr('refY',0)
					.attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto')
					.append('path').attr('d','M0,-5L10,0L0,5 L10,0 L0, -5')
					.style('stroke','gray');

				//Define the xy positions of the link
				link = link.data(graph.links).enter().append('line')
					.attr('x1', function(d) {return d.source.x + nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y + nodeHeight;})
					.attr('x2', function(d) {return d.target.x + nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;})
					.style('marker-end','url(#end)');
			}


			//Function to describe drag behavior
			function dragNodes(dx, dy) {

				nodes.filter(function(d) {return scope.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x += dx;})
					.attr('y', function(d) {return d.y += dy;});

				label.filter(function(d) {return scope.isSelectedDataset(d.dataset);})
					.attr('x', function(d) {return d.x+dx+nodeWidth/2;})
					.attr('y', function(d) {return d.y+dy+nodeHeight/2;});

				link.filter(function(d) {return scope.isSelectedDataset(d.source.dataset)})
					.attr('x1', function(d) {return d.source.x+nodeWidth/2;})
					.attr('y1', function(d) {return d.source.y;});

				link.filter(function(d) {return scope.isSelectedDataset(d.target.dataset)})
					.attr('x2', function(d) {return d.target.x+nodeWidth/2;})
					.attr('y2', function(d) {return d.target.y;});
			}

			function dragEnd() {
				// update positions of all selected datasets to the server
				nodes.filter(function(d) {
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
					{title:'Delete',action:function(elm,d){
						scope.deleteDatasets(scope.selectedDatasets);
					}},
					{title:'Export',action:function(elm,d){
						scope.exportDatasets(scope.selectedDatasets);
					}},
					{title:'View History as text',action:function(){
						scope.showHistory();
					}}
				] ;
			}

			function renderGraph(width,height) {
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

			scope.getDatasetNodes = function(datasetsMap, jobsMap, modulesMap, filter) {

				var datasetNodes = [];
				datasetsMap.forEach(function (targetDataset) {

					var color = 'gray';

					if (targetDataset.sourceJob) {
						if (jobsMap.has(targetDataset.sourceJob)) {
							var sourceJob = jobsMap.get(targetDataset.sourceJob);

							var module = modulesMap.get(sourceJob.module);
							if (module) {
								var category = module.categoriesMap.get(sourceJob.toolCategory);
								if (category) {
									color = category.color;
								}
							}
						} else {
							console.log('source job of dataset ' + targetDataset.name + ' not found');
						}
					}

					datasetNodes.push({
						x: targetDataset.x,
						y: targetDataset.y,
						name: targetDataset.name,
						extension: Utils.getFileExtension(targetDataset.name),
						sourceJob: sourceJob,
						color: color,
						filter: !filter || filter.get(d.datasetId),
						dataset: targetDataset
					});
				});

				return datasetNodes;
			};

			scope.getJobNodes = function(jobsMap, datasetsMap) {

				var jobNodes = [];
				jobsMap.forEach( function(job) {
					// no need to show completed jobs
					if (job.state !== 'COMPLETED') {

						// find inputs for the layout calculation
						var inputDatasets = [];
						angular.forEach(job.inputs, function(input) {
							var dataset = datasetsMap.get(input.datasetId);
							inputDatasets.push(dataset);
						});

						// find out better place for new root nodes
						var x = jobNodes.length * nodeWidth;
						var y = 0;

						if (inputDatasets[0]) {
							x = inputDatasets[0].x;
							y = inputDatasets[0].y + nodeHeight * 2;
						}

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
							x: x,
							y: y,
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

		}//end of link function

	};//end of return

});