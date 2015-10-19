chipsterWeb
		.directive(
				'workflowGraphLayout',
				function($window) {
					return {
						restrict : 'EA',
						require:"^ngController",
						scope : {
							data : "=",
							selectedDatasetId:"=",
							onClick : "&"
						},
						link : function(scope, iElement, iAttrs, parentController) {

							// Calculate total nodes, max label length
							var d3 = $window.d3;
							var c20 = d3.scale.category20();
							var width = window.innerWidth / 2 - 30, height = 800, shiftKey, ctrlKey;
							/*
							 * $window.onresize=function(){
							 * scope.$apply(function(){ //Need to put some
							 * interval here
							 * 
							 * renderGraph(window.innerWidth/2-30,height); }); }
							 */

							scope.$watch('data',function(data) {
								if (data) {
									console.log('render is called');
										renderGraph(width, height);
									
								}
							});

							function renderGraph(width,height) {

								var graph = {};

								var xScale = d3.scale.linear().domain(
										[ 0, width ]).range([0, width ]);
								var yScale = d3.scale.linear().domain(
										[ 0, height ]).range([ 0, height ]);
								
								d3.select('svg').remove();

								var svg = d3.select(iElement[0]).attr(
										"tabindex", 1).on("keydown.brush",
										keydown).on("keyup.brush", keyup).each(
										function() {
											this.focus();
										}).append("svg").attr("width", width)
										.attr("height", height);

								var zoomer = d3.behavior.zoom().scaleExtent(
										[ 0.1, 10 ]).x(xScale).y(yScale).on(
										"zoomstart", zoomstart).on("zoom",
										redraw);

								function zoomstart() {
									node.each(function(d) {
										d.selected = false;
										d.previouslySelected = false;
									});
									node.classed("selected", false);
								}

								function redraw() {
									vis.attr("transform", "translate("
											+ d3.event.translate + ")"
											+ "scale(" + d3.event.scale + ")");
								}

								var brusher = d3.svg
										.brush()
										.x(xScale)
										.y(yScale)
										.on(
												"brushstart",
												function(d) {
													node
															.each(function(d) {
																d.previouslySelected = shiftKey
																		&& d.selected;

															});
												})
										.on(
												"brush",
												function() {
													var extent = d3.event.target
															.extent();
													node
															.classed(
																	"selected",
																	function(d) {
																		return d.selected = d.previouslySelected
																				^ (extent[0][0] <= d.x
																						&& d.x < extent[1][0]
																						&& extent[0][1] <= d.y && d.y < extent[1][1]);
																	});
												}).on(
												"brushend",
												function() {
													d3.event.target.clear();
													d3.select(this).call(
															d3.event.target);
												});

								var svg_graph = svg.append('svg:g')
										.call(zoomer)

								var rect = svg_graph.append('svg:rect').attr(
										'width', width).attr('height', height)
										.attr('fill', 'transparent').attr(
												'stroke', 'transparent').attr(
												'stroke-width', 1).attr("id",
												"zrect") // gave html id

								var brush = svg_graph.append("g").datum(
										function() {
											return {
												selected : false,
												previouslySelected : false
											};
										}).attr("class", "brush");

								var vis = svg_graph.append("svg:g");

								vis.attr('fill','red').attr('stroke', 'black')
										.attr('stroke-width', 1).attr(
												'opacity', 1.0).attr('id',
												'vis')

								brush.call(brusher).on("mousedown.brush", null)
										.on("touchstart.brush", null).on(
												"touchmove.brush", null).on(
												"touchend.brush", null);

								brush.select('.background').style('cursor',
										'auto');
								
								//Defining dataset
								graph = scope.data;
								
								//defining links
								var link = vis.append("g")
										.attr("class", "link")
										.selectAll("line");
								//defining nodes
								var node = vis.append("g")
										.attr("class", "node").selectAll(
												"rect");
								//defining labels 
								var label=vis.append("g")
								  .selectAll("text")
								  .data(graph.nodes)
								  .enter()
								  .append("text")
								  .text(function(d){
									  return d.name;
								  })
								  .attr("x",function(d,i){
									  return d.x+10;
								  })
								  .attr("y",function(d,i){
									  return d.y+5;
								  })
								  .attr("font-size", "8px")
								  .attr("fill","black")
								  .attr("text-anchor", "middle")
								  .on("click",
											function(d) {
												if (d3.event.defaultPrevented)
													return;
												svg.style("cursor","pointer");

												if (!shiftKey) {
													// if the isnt down,
													// unselect everything
													node.classed(
																	"selected",
																	function(
																			p) {
																		return p.selected = p.previouslySelected = false;
																		console.log(p);
																	})

												}

												//always select this node
												d3.select(this)
														.classed(
																"selected",
																d.selected = !d.previouslySelected);
												console.log("label clicked");
												
											}).call(
													d3.behavior
													.drag()
													.on(
															"drag",
															function(d) {
																nudge(
																		d3.event.dx,
																		d3.event.dy);
															}));;
								
								  	  
								
								function nudge(dx, dy) {
									node.filter(function(d) {
										return d.selected;
									}).attr("x", function(d) {
										return d.x += dx;
									}).attr("y", function(d) {
										return d.y += dy;
									})
									
									label.filter(function(d) {
										return d.selected;
									}).attr("x", function(d) {
										return d.x += dx;
									}).attr("y", function(d) {
										return d.y += dy;
									})
									
									link.filter(function(d) {
										return d.source.selected;
									}).attr("x1", function(d) {
										return d.source.x;
									}).attr("y1", function(d) {
										return d.source.y;
									});

									link.filter(function(d) {
										return d.target.selected;
									}).attr("x2", function(d) {
										return d.target.x;
									}).attr("y2", function(d) {
										return d.target.y;
									});
									
									if(d3.event.preventDefault)
										d3.event.preventDefault();
	
								}

								graph.links.forEach(function(d) {
									d.source = graph.nodes[d.source];
									d.target = graph.nodes[d.target];
								});

								link = link.data(graph.links).enter().append(
										"line").attr("x1", function(d) {
									return d.source.x+10;
								}).attr("y1", function(d) {
									return d.source.y;
								}).attr("x2", function(d) {
									return d.target.x+10;
								}).attr("y2", function(d) {
									return d.target.y;
								});

								node = node
										.data(graph.nodes)
										.enter()
										.append("rect")
										.attr("x", function(d) {
											return d.x-5;
										})
										.attr("y", function(d) {
											return d.y-5;
										})
										.attr("width",40)
										.attr("height",30)
										.attr("fill",function(d,i){return c20(i)})
										.on("dblclick", function(d) {
											d3.event.stopPropagation();
										})
										.on(
												"click",
												function(d) {
													if (d3.event.defaultPrevented)
														return;
													svg.style("cursor","pointer");

													if (!shiftKey) {
														// if the isnt down,
														// unselect everything
														node.classed(
																		"selected",
																		function(
																				p) {
																			return p.selected = p.previouslySelected = false;
																		})

													}

													//always select this node
													d3
															.select(this)
															.classed(
																	"selected",
																	d.selected = !d.previouslySelected);
													console.log("node clicked");
													parentController.setDatasetId(d.datasetId);
													
												})
										.on(
												"mouseup",
												function(d) {
													//do something
													if (d.selected && shiftKey)
														d3
																.select(this)
																.classed(
																		"selected",
																		d.selected = false);
													
												})
										.call(
												d3.behavior
														.drag()
														.on(
																"drag",
																function(d) {
																	nudge(
																			d3.event.dx,
																			d3.event.dy);
																}));
								
																

								function keydown() {
									shiftKey = d3.event.shiftKey
											|| d3.event.metaKey;
									ctrlKey = d3.event.ctrlKey;

									console.log('d3.event', d3.event)

									if (d3.event.keyCode == 67) {
										//the c key
									}

									if (shiftKey) {
										svg_graph.call(zoomer).on(
												"mousedown.zoom", null).on(
												"touchstart.zoom", null).on(
												"touchmove.zoom", null).on(
												"touchend.zoom", null);

										vis.selectAll('g.gnode').on(
												'mousedown.drag', null);

										brush.select('.background').style(
												'cursor', 'crosshair')
										brush.call(brusher);

									}
								}

								function keyup() {
									shiftKey = d3.event.shiftKey
											|| d3.event.metaKey;
									ctrlKey = d3.event.ctrlKey;

									brush.call(brusher).on("mousedown.brush",
											null).on("touchstart.brush", null)
											.on("touchmove.brush", null).on(
													"touchend.brush", null);

									brush.select('.background').style('cursor',
											'auto')
									svg_graph.call(zoomer);
								}

							}//end of renderGraph

						}//end of link function

					}//end of return

				});