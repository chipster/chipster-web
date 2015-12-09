/**
* @desc workflowGraphLayout directive that creates the workflow graph for session dataset "d3Data"
* @example <div><workflow-graph-layout data="d3Data"></div>
*/
chipsterWeb.directive('workflowGraphLayout',function($window) {
					return {
						restrict : 'EA',
						require:"^ngController",
						templateUrl:"partials/searchinput.html",
						scope : {
							data : "=",
							selectedDataset:"=",
							searched_dataset_name:"=",	
							orientv:"=",
							onClick : "&"
						},
						link : function(scope, iElement, iAttrs, parentController) {
			
							//@ToDO Calculate total nodes, max label length
							var d3 = $window.d3;
							var c20 = d3.scale.category20();
							var width = (window.innerWidth / 3) - 50, height = 500, shiftKey, ctrlKey;
							var searched_dataset,svg,node,link,nodeCheck,label,vis,menu;
							var graph;
							var nodeWidth=40,nodeHeight=30;
							
							//@ToDO, add the resize div functionality
							
							/*
							 * $window.onresize=function(){
							 * scope.$apply(function(){ //Need to put some
							 * interval here
							 * 
							 * renderGraph(window.innerWidth/2-30,height); }); }
							 */
							

							scope.$watch("data",function() {
								if(scope.data){
									graph=scope.data;
									console.log("watching data");
										renderGraph(width, height);
									}									
								});
							
							 scope.changeNodeCheck = function(){	 
								 drawNodeCheck(scope.data);
						     };
						       
						    function drawNodeCheck(){
						    	 //Adding the check box with the nodes
								nodeCheck=vis.append("g").attr("class", "check").selectAll("check").data(graph.nodes)
									   .enter().append("foreignObject").attr("width",20).attr("height",20)
									   .attr("x",function(d,i){return d.x-20;})
									   .attr("y",function(d,i){return d.y;})	
									   .append("xhtml:body").html("<form><input type=checkbox id=check/></form>")
									   .on("click",function(d,i){
										  d.checked=!d.checked;
										  if(d.checked){parentController.setDatasetId(d);}
										  else{parentController.cancelDatasetSelection(d);}
									  });
									
								nodeCheck.each(function(d) {d.checked = false;});
								nodeCheck.classed("checked",false);
									  
							}
						     
						    scope.$on('changeNodeCheck',function(event,data){
						             scope.changeNodeCheck();
						     });
							
							
							scope.search_dataset=function(searched_dataset_name){
								searched_dataset=searched_dataset_name;
								searchNode(scope.data);
							};
							
							
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
														parentController.getSelectedDataNode(d);
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
								     .append("text").text(function(d){return d.name;})
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
								
								svg = d3.select(iElement[0]).attr("tabindex", 1).on("keydown.brush",keydown).on("keyup.brush", keyup)
									.each(function() {this.focus();}).append("svg").attr("width", width).attr("height", height);

								var zoomer = d3.behavior.zoom().scaleExtent([ 1, 4 ]).x(xScale).y(yScale).on("zoomstart", zoomstart).on("zoom",redraw);

								function redraw() {
									vis.attr("transform", "translate("
											+ d3.event.translate + ")"
											+ "scale(" + d3.event.scale + ")");
								}

								var svg_graph = svg.append('svg:g').call(zoomer)

								var rect = svg_graph.append('svg:rect').attr('width', width).attr('height', height)
										   .attr('fill', 'transparent').attr("id","zrect") // gave html id
												
								vis = svg_graph.append("svg:g");

								vis.attr('fill','red').attr('stroke', 'black').attr('stroke-width', 1)
								   .attr('opacity', 1.0).attr('id','vis')	
								//Rendering the graph elements  
								defineRightClickMenu();
								renderLinks();
								renderNodes();
								drawNodeCheck();
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
						
							//Method for search a specific data file in the workflow graph
							function searchNode(data){
								if(searched_dataset==="none"){
									node.style("stroke","white").style("stroke-width","1");
								}else{
									var selected=node.filter(function(d,i){
										return d.name!=searched_dataset;
									
									});
									
									var selectedCheckBox=nodeCheck.filter(function(d,i){
										return d.name!=searched_dataset;
									});
									
									var selectedLabel=label.filter(function(d,i){
										return d.name!=searched_dataset;
									});
								
									selected.style("opacity","0");
									selectedCheckBox.style("opacity","0");
									link.style("opacity","0");
									selectedLabel.style("opacity","0");
									
									node.transition().duration(10000).style("opacity",1);
									link.transition().duration(10000).style("opacity",1);
									nodeCheck.transition().duration(10000).style("opacity",1);
									label.transition().duration(10000).style("opacity",1);
								}
							}

						}//end of link function

					}//end of return

				});