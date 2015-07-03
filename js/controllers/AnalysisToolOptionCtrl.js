//Controller for specific processing tools
chipsterWeb.controller('AnalysisToolOptionCtrl', function($scope,$http){
	$scope.oneAtATime=true;


	$http.get('js/json/toolSet.json')
		.then(function(res){
			$scope.groups=res.data;
	});


	$scope.status={
		isFirstOpen:true,
		isFirstDisabled:false
	};

});