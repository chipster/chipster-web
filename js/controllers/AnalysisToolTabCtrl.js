//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabCtrl', function($scope, $http) {

	this.tab = 1;
	$scope.tools=[];
	$scope.selectedToolCatIndex=0;
	$scope.currentToolCat=null;
	$scope.selectedView=1;
	
	$http.get('js/json/microarray.json').then(function(res) {
		$scope.tools = res.data;
		console.log($scope.tools);
	});
	
	$scope.setCurrentView=function(value){
		$scope.selectedView=value;
	};
	
	$scope.isViewSet=function(currentView){
		return $scope.selectedView===currentView;
	}

	this.setTab = function(activeTab) {
		this.tab = activeTab;
		$scope.currentToolCat=null;
		if (activeTab == 1) {
			$http.get('js/json/microarray.json').then(function(res) {
				$scope.tools = res.data;
			});
		}
		if (activeTab == 2) {
			$scope.currentToolCat=null;
			$http.get('js/json/ngs.json').then(function(res) {
				$scope.tools = res.data;
			});
		}

	};

	this.isSet = function(checkTab) {
		return this.tab === checkTab;
	};
	
	$scope.selectedToolCat=function(tool,$index){
		$scope.selectedToolCatIndex=$index;
		$scope.currentToolCat=tool;
		console.log(tool);
	};

	$scope.remove = function(scope) {
		scope.remove();
	};

	$scope.toggle = function(scope) {
		scope.toggle();
	};
	
	
	

});

