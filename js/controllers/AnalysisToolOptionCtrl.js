//Controller for specific processing tools
chipsterWeb.controller('AnalysisToolOptionCtrl', function($scope,$http){
    $scope.data = [{
        'id': 1,
        'title': 'Preprocessing',
        'nodes': [
          {
            'id': 11,
            'title': 'node1.1',
            'nodes': [
              {
                'id': 111,
                'title': 'node1.1.1',
                'nodes': []
              }
            ]
          },
          {
            'id': 12,
            'title': 'node1.2',
            'nodes': []
          }
        ]
      }, {
        'id': 2,
        'title': 'Utilities',
        'nodes': [
          {
            'id': 21,
            'title': 'node2.1',
            'nodes': []
          },
          {
            'id': 22,
            'title': 'node2.2',
            'nodes': []
          }
        ]
      }, {
        'id': 3,
        'title': 'Quality Control',
        'nodes': [
          {
            'id': 31,
            'title': 'node3.1',
            'nodes': []
          }
        ]
      },
      {
       'id': 4,
        'title': 'Matching sets of genomic regions'
      },
      {
       'id': 5,
        'title': 'Alignment'
      },
      {
       'id': 6,
        'title': 'Variants'
      },
      {
       'id': 7,
        'title': 'RNA-seq'
      },
      {
       'id': 8,
        'title': 'miRNA-seq'
      },
      {
       'id': 9,
        'title': 'Chip,DNase,and Methyl-seq'
      },
      {
       'id': 10,
        'title': 'CNA-seq'
      },
      {
       'id': 10,
        'title': 'Metagenomics'
      }

      ];

      $scope.remove=function(scope){
        scope.remove();
      };

      $scope.toggle=function(scope){
        console.log('toggle is called');
        scope.toggle();
      };

      $scope.moveLastToTheBeginning=function(){
        var a=$scope.data.pop();
        $scope.data.splice(0,0,a);
      };

      $scope.newSubItem=function(scope){
        var nodeData=scope.$modelValue;
        nodeData.nodes.push({
          id:nodeData.id*10+nodeData.nodes.length,
          title:nodeData.title + '.' + (nodeData.nodes.length + 1),
          nodes:[]
        });
      };


      $scope.collapseAll = function() {
        $scope.$broadcast('collapseAll');//Dispathches the event to all child scopes(and their children) notifying the registered listeners
      };

      $scope.expandAll = function() {
        $scope.$broadcast('expandAll');
      };
    

});


