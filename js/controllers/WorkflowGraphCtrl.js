chipsterWeb.controller('WorkflowGraphCtrl', ['$scope','$http', function($scope,$http){
  
      $http.get('js/json/workflow.json')
        .then(function(res){
          $scope.d3Data=res.data;
        });


    }]);



  chipsterWeb.directive('d3GraphLayout',function($window) {

      //### Start Return Directive  ###
      return {
        restrict: 'EA',
        template:"<svg height='800' width='800'></svg>",
        scope: {
          data: "=",
          onClick: "&"
      },
      link: function(scope, iElement, iAttrs) {

        var d3=$window.d3;
        var c20 = d3.scale.category20();
        
        // We need to call the graph construction code after data is available
        scope.$watch('data', function(data) {
      
          if(data){
            graphData=data;

           var rawSvg=iElement.find('svg');
        
          // Generate the graph diagram  
            var margin = {top: 20, right: 120, bottom: 20, left: 120},
                width = 800 - margin.right - margin.left,
                height = 800 - margin.top - margin.bottom;



          //Defining the force layout
          var force= d3.layout.force()
                        .charge(-120)
                        .linkDistance(30)
                        .size([width,height]);
                         

          var svg = d3.select(rawSvg[0]).append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom);
              
                console.log(graphData.links);

            //put the graph data onto force layout
            force.nodes(graphData.nodes)
                 .links(graphData.links)
                 .start();

            //create all the line svg but without location yet
            var link= svg.selectAll(".link")
                          .data(graphData.links)
                          .enter().append("line")
                          .attr("class","link")
                          .style("marker-end","url(#suit)");

            //create the nodes with circles
            var node=svg.selectAll(".node")
                        .data(graphData.nodes)
                        .enter().append("circle")
                        .attr("class","node")
                        .attr("r",8)
                        .style("fill",function(d){
                          return c20(d.group)
                        })
                        .call(force.drag);


            //give the SVG co-ordinates
            force.on("tick",function(){
              link.attr("x1",function(d){
                    return d.source.x;
              })
                  .attr("y1",function(d){
                    return d.source.y;
                  })
                  .attr("x2",function(d){
                    return d.target.x;
                  })
                  .attr("y2",function(d){
                    return d.target.y;
                  });

              node.attr("cx",function(d){
                return d.x;
              })
                  .attr("cy",function(d){
                    return d.y;
              });


            });

                              

            //Adding tooltip functionality
            var tip=d3.tip()
                      .attr("class","d3-tip")
                      .offset([-10,0])
                      .html(function(d){
                        return d.name+"</span>";
                      })
                  svg.call(tip);
            //End of adding tooltip


            //Adding Zoom function


            //Adding arrow as links
            svg.append("defs").selectAll("marker")
               .data(["suit","licensing","resolved"])
               .enter().append("marker")
               .attr("id",function(d){ return d;})
               .attr("viewBox","0 -5 10 10")
               .attr("refX",25)
               .attr("refY",0)
               .attr("markerWidth",6)
               .attr("markerHeight",6)
               .attr("orient","auto")
               .append("path")
               .attr("d","M0,-5L10,0L0,5,L10,0,L0,-5")
               .style("stroke","#4679BD")
               .style("opacity","0.6");


           

    }//end of if

  });//end of watch 


  }//end of link function

}
//### End Return Directive  ###
});




