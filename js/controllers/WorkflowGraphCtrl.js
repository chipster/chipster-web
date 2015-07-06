chipsterWeb.controller('WorkflowGraphCtrl', ['$scope', function($scope){
      
      $scope.showObj = function(item){
        $scope.item = item;
        console.log($scope.item);
      }

      $scope.d3Data = [{
        "nodes":[
                  {"name":"bam1","group":1,x:200,y:150},
                  {"name":"pdf","group":2,x:140,y:300},
                  {"name":"log","group":2,x:300,y:300},
                  {"name":"bed","group":3,x:300,y:180}
                ],
        "links":[
                  {"source":0,"target":1,"weight":1},
                  {"source":1,"target":2,"weight":3},
                  {"source":2,"target":3,"weight":3}
              ]
            
        }];
       


      //End of json file

    }]);




  chipsterWeb.directive('d3GraphLayout',function($window) {

      //### Start Return Directive  ###
      return {
      restrict: 'EA',
      template:"<svg height='600' width='800'></svg>",
      scope: {
        data: "=",
        onClick: "&"
      },
      link: function(scope, iElement, iAttrs) {

        // Calculate total nodes, max label length
        var d3=$window.d3;

        var c20 = d3.scale.category20();

        graphData=scope.data[0];
        console.log(graphData.nodes);



        // ************** Generate the graph diagram  *****************
        var margin = {top: 20, right: 120, bottom: 20, left: 120},
            width = 800 - margin.right - margin.left,
            height = 600 - margin.top - margin.bottom;
            
        
        var rawSvg=iElement.find('svg');


        var svg = d3.select(rawSvg[0]).append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
                });
            });


        var link=svg.selectAll(".link")
                  .data(graphData.links)
                  .enter().append("line")
                  .attr("class","link")
                  .attr("x1",function(l){
                     var sourceNode=graphData.nodes.filter(function(d,i)
                     { return i==l.source})[0];
                     d3.select(this).attr("y1",sourceNode.y);
                     return sourceNode.x
                    })
                  .attr("x2",function(l){
                    var targetNode=graphData.nodes.filter(function(d,i)
                      {return i==l.target})[0];
                    d3.select(this).attr("y2",targetNode.y);
                    return targetNode.x

                  })
                  .attr("fill","none")
                  .attr("stroke","white");

        var node=svg.selectAll(".node")
                    .data(graphData.nodes)
                    .enter().append("g")
                    .append("circle")
                    .attr("class","node")
                    .attr("cx",function(d){return d.x})
                    .attr("cy",function(d){return d.y})
                    .attr("r",15)
                    .attr("fill",function(d,i){return c20(i)})
                    .append("text")
                        .attr("dx",12)
                        .attr("dy",".35em")
                        .text(function(d){return d.name}) 
                    .call(drag);


          

    }

}
//### End Return Directive  ###
});




