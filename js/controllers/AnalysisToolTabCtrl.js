//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabCtrl', function($scope,$http){

	$http.get('js/json/toolType.json')
	.then(function(res){
		$scope.tabs=res.data;
	});

});