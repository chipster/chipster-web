//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabCtrl', function($scope, $http) {

	this.tab = 1;

	$http.get('js/json/microarray.json').then(function(res) {
		$scope.data = res.data;
	});

	this.setTab = function(activeTab) {
		this.tab = activeTab;
		console.log('tab clicked');
		if (activeTab == 1) {
			$http.get('js/json/microarray.json').then(function(res) {
				console.log(res);
				$scope.data = res.data;
			});
		}
		if (activeTab == 2) {
			$http.get('js/json/ngs.json').then(function(res) {
				console.log(res);
				$scope.data = res.data;
			});
		}

	};

	this.isSet = function(checkTab) {
		return this.tab === checkTab;
	};

	$scope.remove = function(scope) {
		scope.remove();
	};

	$scope.toggle = function(scope) {
		console.log('toggle is called');
		scope.toggle();
	};

	$scope.moveLastToTheBeginning = function() {
		if ($scope.data) {
			var a = $scope.data.pop();
			$scope.data.splice(0, 0, a);
		}

	};

	$scope.newSubItem = function(scope) {
		var nodeData = scope.$modelValue;
		nodeData.nodes.push({
			id : nodeData.id * 10 + nodeData.nodes.length,
			title : nodeData.title + '.' + (nodeData.nodes.length + 1),
			nodes : []
		});
	};

	$scope.collapseAll = function() {
		$scope.$broadcast('collapseAll');//Dispathches the event to all child scopes(and their children) notifying the registered listeners
	};

	$scope.expandAll = function() {
		$scope.$broadcast('expandAll');
	};
});

chipsterWeb.factory('tools', function($http, $q) {
	return {
		data : function(url) {
			//create a deffered object
			var deferred = $q.defer();

			//make the http call
			$http.get(url).success(function(data) {
				console.log(url);
				//when data is returned resolve the deferment
			}).error(function() {
				deferred.reject();
			});

			//return the the promise that work will be done.
			return deferred.promise;
		}
	}

});