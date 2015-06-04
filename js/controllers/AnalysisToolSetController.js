chipsterWeb.controller('AnalysisToolSetController', function($scope, $http) {
  $http.get('js/json/toolSet.json')
       .then(function(res){
          $scope.toolset = res.data;                
        });
});