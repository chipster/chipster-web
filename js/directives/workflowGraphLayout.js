chipsterWeb.directive('workflowGraphLayout', function($window){
	return {
		restrict: 'EA',
		scope: {
			data: "=",
			onClick: "&"
		},
		link: function(scope, iElement, iAttrs) {

        // Calculate total nodes, max label length
        var d3=$window.d3;

        var c20 = d3.scale.category20();

        var width=window.innerWidth/2-30,
        height=800,
        shiftKey,ctrlKey;

        $window.onresize=function(){
        	scope.$apply(function(){
            //Need to put some interval here

            renderGraph(window.innerWidth/2-30,height);
        });
        }

        scope.$watch('data',function(data){
        	if(data){
        		renderGraph(width,height);
        	}

        });


        function renderGraph(width,height){
        	graphdata={};
        	graphdata=scope.data;

        	var margin = {top: 10, right: 10, bottom: 10, left: 30};     

        	d3.select('svg').remove();

        	var xScale=d3.scale.linear().domain([0,width]).range([0,width]);
        	var yScale=d3.scale.linear().domain([0,height]).range([0,height]);

        	var svg=d3.select(iElement[0])
        	.attr("tabindex",1)
        	.on("keydown.brush",keydown)
        	.on("keyup.brush",keyup)
        	.each(function(){this.focus();})
        	.append('svg')
        	.attr('width',width)
        	.attr('height',height);              

          
           var zoomer=d3.behavior.zoom()
           .scaleExtent([0.1,10])
           .x(xScale)
           .y(yScale)
           .on("zoomstart",zoomstart)
           .on("zoom",redraw);

           function zoomstart(){
           	node.each(function(d){
           		d.selcted=false;
           		d.previouslySelected=false;
           	});
           	node.classed("selected",false);
           } //End of zoomstart

           function redraw(){
           	vis.attr("transform",
           		"translate("+d3.event.translate+")"+"scale("+d3.event.scale+")");
           }//end of redraw

           var brusher=d3.svg.brush()
           .x(xScale)
           .y(yScale)
           .on("brushstart",function(d){
           	node.each(function(d){
           		d.previouslySelected=shiftKey && d.selected;

           	});
           })
           .on("brush",function(){
           	var extent=d3.event.target.extent();
           	node.classed("selected",function(d){
           		return d.selected=d.previouslySelected ^(extent[0][0]<=d.x && d.x<extent[1][0]
           			&& extent[0][1]<=d.y&&d.y<extent[1][1]);
           	});
           })
           .on("brushend",function(){
           	d3.event.target.clear();
           	d3.select(this).call(d3.event.target);
           });

           var svg_graph=svg.append('svg:g')
           .call(zoomer);

           var rect=svg_graph.append('svg:rect')
           .attr('width',width)
           .attr('height',height)
           .attr('fill','transparent')
           .attr('stroke','transparent')
           .attr('stroke-width',1)
		 	.attr("id","zrect") //gave html id

						  var brush=svg_graph.append("g")
						  .datum(function(){ return{selected:false,previouslySelected:false}; })
						  .attr("class","brush");

						  var vis=svg_graph.append("svg:g");

						  vis.attr('fill','red')
						  .attr('stroke','black')
						  .attr('stroke-width',1)
						  .attr('opacity',0.5)
						  .attr('id','vis');


						  brush.call(brusher)
						  .on("mousedown.brush",null)
						  .on("touchstart.brush",null)
						  .on("touchmove.brush",null)
						  .on("touchend.brush",null);

						  brush.select('.background').style('cursor','auto');


						  var link=vis.append("g")
						  .attr("class","link")
						  .selectAll("line");

						  var node=vis.append("g")
						  .attr("class","node")
						  .selectAll("circle");

					function nudge(dx,dy){
						  	node.filter(function(d){return d.selected;})
						  	.attr("cx",function(d){ return d.x += dx; })
						  	.attr("cy",function(d){ return d.y += dy; })

						  	link.filter(function(d){
						  		return d.source.selected;
						  	})
						  	.attr("x1", function(d){ return d.source.x;})
						  	.attr("y1", function(d){ return d.source.y;});

						  	link.filter(function(d){ 
						  		return d.target.selected;
						  	})
						  	.attr("x2", function(d){ return d.target.x;})
						  	.attr("y2", function(d){ return d.target.y;});



						  	console.log("drag not working");

			//d3.event.preventDefault();

		}
		
		graphdata.links.forEach(function(d){
			d.source=graphdata.nodes[d.source];
			d.target=graphdata.nodes[d.target];
			
		});


		link=link.data(graphdata.links).enter().append("line")
		.attr("x1",function(d){ return d.source.x;})
		.attr("y1",function(d){ return d.source.y;})
		.attr("x2",function(d){ return d.target.x;})
		.attr("y2",function(d){ return d.target.y;});


		node=node.data(graphdata.nodes).enter().append("circle")
		.attr("r",10)
		.attr("cx",function(d){ return d.x; })
		.attr("cy",function(d){ return d.y; })
		.attr("fill",function(d,i){return c20(d)})
		.on("dblclick",function(d){ d3.event.stopPropagation(); })
		.on("click",function(d){
			if(d3.event.defaultPrevented) return;

			if(!shiftKey){
				 		//if the isnt down, unselect everything
				node.classed("selected",function(p) { return p.selected=p.previouslySelected=false; })

				 	}

				 	//always select this node
				 	d3.select(this).classed("selected", d.selected=!d.previouslySelected);
				 })
		.on("mouseup",function(d){
				 	//do something
				 	if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
				 })
		.call(d3.behavior.drag()
			.on("drag", function(d){ nudge(d3.event.dx,d3.event.dy);}));


}

function keydown(){
			shiftKey=d3.event.shiftKey||d3.event.metaKey;
			ctrlKey=d3.event.ctrlKey;

			//console.log('d3.event',d3.event)

			if(d3.event.keyCode == 67){
				//the c key
			}

			if(shiftKey){
				svg_graph.call(zoomer)
				.on("mousedown.zoom",null)
				.on("touchstart.zoom",null)
				.on("touchmove.zoom",null)
				.on("touchend.zoom",null);

				vis.selectAll('g.gnode')
				.on('mousedown.drag',null);

				brush.select('.background').style('cursor','crosshair')
				brush.call(brusher);


			}
		}

		function keyup(){
			shiftKey=d3.event.shiftKey||d3.event.metaKey;
			ctrlKey=d3.event.ctrlKey;

			brush.call(brusher)
			.on("mousedown.brush",null)
			.on("touchstart.brush",null)
			.on("touchmove.brush",null)
			.on("touchend.brush",null);

			brush.select('.background').style('cursor','auto')
			svg_graph.call(zoomer);
		}

	
}//end of render graph



  }//end of link function


});