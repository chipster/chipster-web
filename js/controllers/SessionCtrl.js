chipsterWeb.controller('SessionCtrl',
							function($http, $scope,$routeParams, TemplateService, SessionRestangular, AuthenticationService,$window,PanZoomService){


	$scope.sessionId=$routeParams.sessionId;
	//SessionRestangular is a restangular object with configured baseUrl and authorization header
	$scope.sessionUrl=SessionRestangular.one($scope.sessionId);


	$scope.sessionName="";
	$scope.sessionDetail="";
	$scope.d3Data={};



	// The panzoom config model can be used to override default configuration values
    $scope.panzoomConfig = {
            zoomLevels: 12,
            neutralZoomLevel: 5,
            scalePerZoomLevel: 1.5
  
        };

   // The panzoom model should initialle be empty; it is initialized by the <panzoom>
   // directive. It can be used to read the current state of pan and zoom. Also, it will
   // contain methods for manipulating this state.
    $scope.panzoomModel = {};


	

	$scope.getJobs=function(){
		
		$scope.sessionUrl.getList('jobs');

	}

	$scope.getSessionDetail=function(){

		//get session detail
		$scope.sessionUrl.get().then(function(result){
			$scope.sessionName=result.name;
			$scope.sessionDetail=result.notes;
			
		}, function(error){
			console.log(error);
		});


		//getDataset list for this session
		$scope.sessionUrl.all('datasets').getList()
			.then(function(res){
				console.log(res.plain());
				$scope.d3Data=res.plain();
				 angular.forEach($scope.d3Data,function(elem,index){
              			elem.group=1;
              			elem.c_id=0;
              			elem.level=1;
              			elem.x=index*150+50;

            });
		});
		
	
	}

	$scope.getDataSets=function(){
		$scope.datalist=$scope.sessionUrl.all('datasets').getList().$object;
		console.log(scope.datalist.object)
		 

	}


	$scope.addDataset=function(){

		var newDataset=TemplateService.getDatasetTemplate();
		console.log(newDataset);

		var datasetUrl=SessionRestangular.all($scope.sessionId).one('datasets');
		datasetUrl.customPOST(newDataset);


	}
});



chipsterWeb.directive('ngsGraphLayout',function($window) {

      //### Start Return Directive  ###
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
            height=800;

        function renderGraph(width,height){

            var margin = {top: 10, right: 10, bottom: 10, left: 30};     

            d3.select('svg').remove();
        
            var svg=d3.select(iElement[0])
                      .append('svg')
                      .attr('width',width)
                      .attr('height',height);              

           //appending arrow for the links

            svg.append("defs").selectAll("marker")
               .data(["suit","licensing","resolved"])
               .enter().append("marker")
               .attr("id",function(d){return d;})
               .attr("viewBox","0 -5 10 10")
               .attr("refX",25)
               .attr("refY",0)
               .attr("markerWidth",6)
               .attr("markerHeight",6)
               .attr("orient","auto")
               .append("path")
               .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
               .style("stroke","#4679BD")
               .style("opacity","0.6");


             var text = svg.append("g")
                      .attr("class", "labels")
                      .selectAll("text")
                      .data(graphData.nodes)
                      .enter().append("text")
                      .attr("dx", 15)
                      .attr("dy", ".20em")
                      .text(function(d) { return d.name });

            function transform(d){
               return "translate(" + d.x + "," + d.y + ")";
            }


            function dragstarted(d){
              d3.event.sourceEvent.stopPropagation();
              svg.classed("dragging",true);
            }

            function dragended(d){
              svg.classed("dragging",false);
            }

            var drag = d3.behavior.drag()
                  .on("drag", function(d,i) {
                          d.x += d3.event.dx
                          d.y += d3.event.dy

                        d3.select(this).attr("cx", d.x).attr("cy",d.y);
                        link.each(function(l,li){ 
                        if(l.source==i){
                          d3.select(this).attr("x1",d.x).attr("y1",d.y);        
                        } else if(l.target==i){
                          d3.select(this).attr("x2",d.x).attr("y2",d.y);
                        } 
                        text.attr("transform", transform);
                    });
                })
                .on("dragstart",dragstarted)
                .on("dragend",dragended);


            var link=svg.selectAll("link")
                      .data(graphData.links)
                      .enter().append("line")
                      .attr("class","link")
                      .attr("x1",function(l){
                         var sourceNode=graphData.nodes.filter(function(d,i)
                         { return i==l.source})[0];
                         d3.select(this).attr("y1",sourceNode.y);
                         return sourceNode.x;
                        })
                      .attr("x2",function(l){
                        var targetNode=graphData.nodes.filter(function(d,i)
                          {return i==l.target})[0];
                        d3.select(this).attr("y2",targetNode.y);
                        return (targetNode.x)

                      })
                      .attr("fill","none")
                      .attr("stroke","white")
                      .style("marker-end","url(#suit)");



            var node=svg.selectAll("node")
                        .data(graphData.nodes)
                        .enter()
                        .append("circle")
                        .attr("class","node")
                        .attr("cx",function(d){return d.x})
                        .attr("cy",function(d){return d.y})
                        .attr("r",10)
                        .attr("fill",function(d,i){return c20(d)})
                        .call(drag);

            text.attr("transform", transform);
        }

        //Making the SVG Responsive

        $window.onresize=function(){
              
            scope.$apply(function(){

            //Need to put some interval here
            renderGraph(window.innerWidth/2-30,height);
          
          });
        }

        scope.$watch('data',function(data){
        if(data){
        	graphData={};
        	
            graphData.nodes=scope.data;
            graphData.links=[];

            /*addng x y positions for the data
            angular.forEach(graphData.nodes,function(elem,index){
              var add_x=(index%2)==0?10:-10;

              elem.x=elem.c_id*80+add_x+80;
              elem.y=elem.level*40+elem.group*20;
            });
            */

            renderGraph(width,height);
            console.log('render is called');
            
            }

          });


    }//end of link function

}
//### End Return Directive  ###
});