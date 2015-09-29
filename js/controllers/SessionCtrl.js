chipsterWeb.controller('SessionCtrl', ['$http','$scope','$routeParams','SessionRestConfigService',
							function($http, $scope, $routeParams, Restangular, SessionConfigRestService){

	$scope.sessionId=$routeParams.sessionId;
	$scope.sessionUrl=Restangular.one($scope.sessionId);


	$scope.getSessionDetail=function(){
		$scope.sessionUrl.get().then(function(results){
			$scope.datasets=results;
		}, function(error){
			console.log(error);
		});

	}


	$scope.getSessionDataSet=function(){

		$scope.sessionUrl.getList('datasets');

	}
	

	$scope.getJobs=function(){
		
		$scope.sessionUrl.getList('jobs');

	}

	$scope.addDataset=function(){

	}
}]);