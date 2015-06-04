//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabController', function($scope,$http){

	$http.get('js/json/toolType.json')
	.then(function(res){
		$scope.tabs=res.data;
	});

});