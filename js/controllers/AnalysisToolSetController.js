chipsterWeb.controller("AnalysisToolSetController",['$scope','$http',function($scope,$http){

	$http.get('js/json/toolSet.json').success(function(data){

		$scope.toolset=data;
		console.log(data);
	})



}]);