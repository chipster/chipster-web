/**
* @desc workflowGraphLayout directive that creates the workflow graph for session dataset "d3Data"
* @example <div><workflow-graph-layout data="d3Data"></div>
*/
chipsterWeb.directive('workflowGraphLayout',function($window,WorkflowGraphService) {
					return {
						restrict : 'EA',
						require:"^ngController",
						scope : {
							data : "=",
							selectedDataset:"=",
							onClick : "&"
						},
						link : function(scope, iElement, iAttrs, parentController) {
							var d3 = $window.d3;
							var c20 = d3.scale.category20();
							var width = (window.innerWidth / 2) - 50;
							var height = (window.innerHeight-300);
							var shiftKey, ctrlKey;
							var searched_dataset,svg,node,link,label,vis,menu,pb_svg,dLinks;
							var graph;
							var nodeWidth=40,nodeHeight=30;
								
							scope.$on('resizeWorkFlowGraph',function(event,data){
								width=data.data.width-50;
								renderGraph(width, height);
							});
							
							scope.$watch("data",function() {
								if(scope.data){
									graph=scope.data;
										renderGraph(width, height);
									}									
								});
							
							//Trigger updating the graph for new dataset
							scope.$on('datasetAdded',function(){
								if(scope.data){
									graph=scope.data;
									renderGraph(width, height);
								}
							});
							
							//creating dummy temporary links for progress node in the graph
							scope.$on('addDummyLinks',function(event,data){
								console.log(data.data);
								dummyLinkData=data.data;
								dLinks = vis.append("g").attr("class", "dummylink").selectAll("line");
								
								//Define the link source and target
								dummyLinkData.dummyLinks.forEach(function(d) {
									d.source = graph.nodes[d.source];
									d.target = dummyLinkData.node;
									console.log(d.source);
								});
								
								//building the arrows for the link end
								vis.append("defs").selectAll("marker").data(["end"]).enter().append("marker")
								   .attr("id", String).attr("viewBox","0 -5 12 12").attr("refX",20).attr("refY",0)
								   .attr("markerWidth",7).attr("markerHeight",7).attr("orient","auto")
								   .append("path").attr("d","M0,-5L10,0L0,5 L10,0 L0, -5")
								   .style("stroke","#0177b7");
								//Define the xy positions of the link
								dLinks = dLinks.data(dummyLinkData.dummyLinks).enter().append("line")
									  .attr("x1", function(d) {return d.source.x+nodeWidth/2;})
									  .attr("y1", function(d) {return d.source.y+nodeHeight;})
									  .attr("x2", function(d) {return d.target.x+nodeWidth/2;})
									  .attr("y2", function(d) {return d.target.y;})
									  .style("marker-end","url(#end)");
								
							});
							
							scope.$on('addProgressBar',function(event,data){
								//data 
								console.log(data);
								renderLinks();
								var twoPi=2*Math.PI;
								var arc=d3.svg.arc().innerRadius(10).outerRadius(15).startAngle(0);
								pb_svg=vis.append("g").attr("transform", "translate(" + data.data.x + "," + data.data.y+ ")");
								
								var rect=pb_svg.append("rect").attr("width",nodeWidth).attr("height",nodeHeight).style("stroke", 'black')
				                .style("fill", "none")
				                .style("stroke-width", 1);
												
								//add the background arc
								var background=pb_svg.append("path").datum({endAngle:0.75*twoPi}).style("fill","#4d4ddd").attr("d",arc);						
								background.call(spin, 1500);
														
												
								function spin(selection,duration){
									selection.transition().ease("linear").duration(duration).attrTween("transform", function() {
								        return d3.interpolateString(
								                "translate(20,15)rotate(0)",
								                "translate(20,15)rotate(360)"
								              );
								            });
									setTimeout(function(){ spin(selection,duration);},duration);
								}
								
								function transitionFunction(path) {
							        path.transition()
							            .duration(7500)
							            .attrTween("stroke-dasharray", tweenDash)
							            .each("end", function() { d3.select(this).call(transition); });
							    }
												
							
						
							});
							
							// When the job is finished, remove both the progress node and dummy links
							scope.$on('removeProgressBar',function(event,data){
								pb_svg.remove();
								dLinks.remove();
							});
						     
							function renderNodes(){
								node = vis.append("g").attr("class", "node").selectAll("rect");
	
								var tip=d3.tip().attr("class","d3-tip").offset([-10,0]).html(function(d){return d.name+"";});
								svg.call(tip);
								
								//Drawing the nodes in the SVG
								node = node.data(graph.nodes).enter().append("rect")
										.attr("x", function(d) {return d.x;})
										.attr("y", function(d) {return d.y;})
										.attr("width",nodeWidth).attr("height",nodeHeight)
										.attr("fill",function(d,i){return c20(i);})
										.on("dblclick", function(d){
											//connectedNodes(d);
										})
										.on("click",function(d) {		
													d3.select(this).classed("selected",d.selected=!d.selected);
													//For showing dataset detail
													scope.$apply(function(){
														parentController.setSelectedDataNode(d);
													});
										})
										.call(d3.behavior.drag().on("drag",function(d) {
												   parentController.cancelDatasetSelection(d.datasetId);
												   dragNodes(d3.event.dx,d3.event.dy);}))
										.on("contextmenu",d3.contextMenu(menu))
										.on("mouseover",tip.show)
										.on("mouseout",tip.hide);
								
								//Define initial value for selected
								node.each(function(d) {d.selected = false;});
								}
							
							function renderLabels(){
								console.log("rendering label");
								label=vis.append("g").selectAll("text").data(graph.nodes).enter()
								     .append("text").text(function(d){return WorkflowGraphService.getFileExtension(d.name);})
								     .attr("x",function(d,i){return d.x+nodeWidth/2;})
								     .attr("y",function(d,i){return d.y+nodeHeight/2;})
								     .attr("font-size", "10px").attr("fill","black").attr("text-anchor", "middle")
								     .call(d3.behavior.drag().on("drag",function(d) {
								    	 dragNodes(d3.event.dx,d3.event.dy);}))
									 .on("contextmenu",d3.contextMenu(menu));	
							}
							
							function renderLinks(){
								//defining links
								link = vis.append("g").attr("class", "link").selectAll("line");
								
								//Define the link source and target
								graph.links.forEach(function(d) {
									d.source = graph.nodes[d.source];
									d.target = graph.nodes[d.target];
								});
								
								//building the arrows for the link end
								vis.append("defs").selectAll("marker").data(["end"]).enter().append("marker")
								   .attr("id", String).attr("viewBox","0 -5 12 12").attr("refX",20).attr("refY",0)
								   .attr("markerWidth",7).attr("markerHeight",7).attr("orient","auto")
								   .append("path").attr("d","M0,-5L10,0L0,5 L10,0 L0, -5")
								   .style("stroke","#0177b7");
								//Define the xy positions of the link
								link = link.data(graph.links).enter().append("line")
									  .attr("x1", function(d) {return d.source.x+nodeWidth/2;})
									  .attr("y1", function(d) {return d.source.y;})
									  .attr("x2", function(d) {return d.target.x+nodeWidth/2;})
									  .attr("y2", function(d) {return d.target.y;})
									  .style("marker-end","url(#end)");
							}
							
							
							//Function to describe drag behavior
							function dragNodes(dx,dy) {
								node.filter(function(d) {return d.selected;})
								.attr("x", function(d) {return d.x += dx;})
								.attr("y", function(d) {return d.y += dy;});
								
								label.filter(function(d) {return d.selected;})
								.attr("x", function(d) {return d.x+dx+nodeWidth/2;})
								.attr("y", function(d) {return d.y+dy+nodeHeight/2;});
								
								link.filter(function(d) {return d.source.selected;})
								.attr("x1", function(d) {return d.source.x+nodeWidth/2;})
								.attr("y1", function(d) {return d.source.y;});

								link.filter(function(d) {return d.target.selected;})
								.attr("x2", function(d) {return d.target.x+nodeWidth/2;})
								.attr("y2", function(d) {return d.target.y;});
								
								if(d3.event.preventDefault)d3.event.preventDefault();

							}
							
							function defineRightClickMenu(){
								
								menu=[{title:'Visualize',action: function(elem,d,i){}},
									      {title:'link to phenodata',action:function(elm,d,i){}},
									      {title:'link between selected',action:function(elm,d,i){}},
									{title:'Rename',action:function(elm,d,i){									
											 var result = prompt('Change the name of the node',d.name);
										     if(result) {d.name = result;}
										     parentController.renameDataset(d,result);
											 svg.selectAll("text").remove();
											 renderLabels();		
										}},
									{title:'Delete',action:function(elm,d,i){}},
									{title:'Export',action:function(elm,d,i){}},
									{title:'View History as text',action:function(elm,d,i){}}
									] ;
							}
							
							function renderGraph(width,height) {
								d3.select('svg').remove();
															
								var xScale = d3.scale.linear().domain([ 0, width ]).range([0, width ]);
								var yScale = d3.scale.linear().domain([ 0, height ]).range([ 0, height ]);
								
								svg = d3.select(iElement[0]).append("svg").attr("width", width).attr("height", height);

								var zoomer = d3.behavior.zoom().scaleExtent([ 1, 4 ]).x(xScale).y(yScale).on("zoomstart", zoomstart).on("zoom",redraw);

								function redraw() {
									vis.attr("transform", "translate("
											+ d3.event.translate + ")"
											+ "scale(" + d3.event.scale + ")");
								}

								var svg_graph = svg.append('svg:g').call(zoomer);

								var rect = svg_graph.append('svg:rect').attr('width', width).attr('height', height)
										   .attr('fill', 'transparent');
												
								vis = svg_graph.append("svg:g");

								vis.attr('fill','red')
								   .attr('opacity', 1.0).attr('id','vis');
								//Rendering the graph elements  
								defineRightClickMenu();
								renderLinks();
								renderNodes();
								renderLabels();
								
								function zoomstart() {
									node.each(function(d) {
										d.selected = false;
										d.previouslySelected = false;
									});
								node.classed("selected", false);
								}
							
								function keydown() {
									shiftKey = d3.event.shiftKey
											|| d3.event.metaKey;
									ctrlKey = d3.event.ctrlKey;

									if (d3.event.keyCode == 67) {
										//the c key
									}

									if (shiftKey) {
										svg_graph.call(zoomer).on("mousedown.zoom", null).on("touchstart.zoom", null)
										.on("touchmove.zoom", null).on("touchend.zoom", null);

										vis.selectAll('g.gnode').on('mousedown.drag', null);
									}
								}

								function keyup() {
									shiftKey = d3.event.shiftKey
											|| d3.event.metaKey;
									ctrlKey = d3.event.ctrlKey;
									svg_graph.call(zoomer);
								}
								
							}//end of renderGraph
						
							
							//Method for search data file in the workflow graph
							scope.$on('searchDatasets', function(event,data){
								var searchedDataesets=data.data;
								searchedDataesets.forEach(function(elem){
									searchNode(elem.name);
								});
								
							});
							
							function searchNode(datasetName){
								if(datasetName==="none"){
									node.style("stroke","white").style("stroke-width","1");
								}else{
									//Selected and not selected nodes
									var notSelected=node.filter(function(d,i){
										return d.name!=datasetName;
									
									});
									
									var Selected=node.filter(function(d,i){
										return d.name===datasetName;
									});

									//Selected and not selected label
									var notSelectedLabel=label.filter(function(d,i){
										return d.name!=datasetName;
									});
									
									var SelectedLabel=label.filter(function(d,i){
										return d.name===datasetName;
									});
									
									notSelected.style("opacity","0.25");
									link.style("opacity","0.25");
									notSelectedLabel.style("opacity","0.25");
									
									Selected.style("opacity","1.0");
									SelectedLabel.style("opacity","1.0");
									
								}
							}

						}//end of link function

					};//end of return

				});