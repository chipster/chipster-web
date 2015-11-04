//Controller for different toolse
chipsterWeb.controller('SessionViewCtrl', function($scope) {

	$scope.item=1;
	
	

	$scope.setItem = function(value) {
		$scope.item=value;
	};

	$scope.isSet = function(value) {
		return $scope.item === value;
	};
	
	
});

