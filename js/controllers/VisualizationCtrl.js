/**
 * @desc Visualization panel controller for loading the result components of analysis jobs in the visualization panel
 * @example <div ng-controller="VisualizationCtrl"></div>
 */

chipsterWeb.controller('VisualizationCtrl',function($scope, $routeParams, FileRestangular, baseURLString, AuthenticationService){

	$scope.setTab = function(value) {
		$scope.tab = value;
	};

	$scope.isTab = function(value) {
		return $scope.tab === value;
	};

	$scope.$watch("dataNode", function(newValue, oldValue) {
		$scope.setTab(1);
	});


	$scope.showText = function() {
		$scope.getDatasetData();
		$scope.visualizationTemplate = "partials/visualizations/text.html";
		$scope.setTab(2)
	};

	$scope.showImage = function() {
		$scope.visualizationTemplate = "partials/visualizations/image.html";
		$scope.dataNode.url = $scope.getDatasetUrl();
		$scope.setTab(2)
	};

	$scope.showPdf = function() {
		$scope.visualizationTemplate = "partials/visualizations/pdf.html";
		$scope.setTab(2)

		//blocks for the visualization controlling
		$scope.pdfFileName='Theory of Relativity';//name of the pdf result file to view
		$scope.pdfUrl=$scope.getDatasetUrl();
		$scope.scroll=0;
		$scope.loading='loading';

		$scope.getNavStyle=function(scroll){
			if(scroll>100) return 'pdf-controls fixed';
			else return 'pdf-controls';

		};

		$scope.onError=function(error){
			console.log(error);
		};

		$scope.onLoad=function(){
			$scope.loading='';
		};

		$scope.onProgress=function(progress){

		};
	};

	$scope.getDatasetData = function() {
		FileRestangular.one('sessions', $routeParams.sessionId)
			.one('datasets', $scope.dataNode.datasetId)
			.get().then(function(resp) {
			console.log(resp);
			$scope.dataNode.file = resp.data;
		});
	};

	$scope.getDatasetUrl = function() {
		//TODO can Restangular build this?
		//TODO should we have separate read-only tokens for datasets?
		return baseURLString
			+ 'filebroker/sessions/' + $routeParams.sessionId
			+ '/datasets/' + $scope.dataNode.datasetId
			+ '?token=' + AuthenticationService.getToken();
	};
});