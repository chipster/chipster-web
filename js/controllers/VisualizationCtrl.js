/**
 * @desc Visualization panel controller for loading the result components of analysis jobs in the visualization panel
 * @example <div ng-controller="VisualizationCtrl"></div>
 */

chipsterWeb.controller('VisualizationCtrl',function($scope, $routeParams, FileRestangular, baseURLString, AuthenticationService, $compile){

	$scope.setTab = function(value) {
		$scope.tab = value;
	};

	$scope.isTab = function(value) {
		return $scope.tab === value;
	};

	$scope.$watch("selectedDatasets", function(newValue, oldValue) {
		$scope.setTab(1);
	});

	$scope.visualizations = [
		// when adding a new visualization, remember to include it (the directive) in the index.html file
		{
			directive: 'chipster-image',
			icon: 'glyphicon-picture',
			name: 'Image',
			extensions: ['png', "jpg", "jpeg"],
			preview: true
		},
		{
			directive: 'chipster-pdf',
			icon: 'glyphicon-book',
			name: 'PDF',
			extensions: ['pdf'],
			preview: true
		},
		{
			directive: 'chipster-spreadsheet',
			icon: 'glyphicon-th',
			name: 'Spreadsheet',
			extensions: ['tsv', 'bed'],
			preview: false
		},
		{
			directive: 'chipster-phenodata',
			icon: 'glyphicon-edit',
			name: 'Phenodata',
			extensions: ['tsv'],
			preview: false
		},
		{
			directive: 'chipster-text',
			icon: 'glyphicon-font',
			name: 'Text',
			extensions: ['txt', 'tsv', 'bed'],
			preview: false
		}
	];

	$scope.currentVisualization = null;

	// check if the visualization is compatible with the selected dataset
	$scope.isCompatible = function (visualization) {
		if ($scope.isSingleDatasetSelected()) {
			var extension = $scope.selectedDatasets[0].name.split('.').pop();
			return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
		}
		return false;
	};

	$scope.getVisualizations = function () {
		return $scope.visualizations.filter( function (visualization) {
			return $scope.isCompatible(visualization);
		});
	};

	$scope.showPreview = function () {
		var visualizations = $scope.getVisualizations();
		return visualizations.length === 1 && visualizations[0].preview;
	};

	// compile the selected visualization directive and show it
	// only for a single dataset for now
	$scope.show = function (vis) {
		if (!$scope.isSingleDatasetSelected) {
			console.log("trying to show visualization, but " + $scope.selectedDatasets.length + " datasets selected");
			return;
		}

		$scope.setTab(2);
		$scope.currentVisualization = vis;
		var directive = angular.element('<' + vis.directive + '/>');
		directive.attr('src', 'getDatasetUrl()');
		directive.attr('dataset-id', 'selectedDatasets[0].datasetId');
		directive.attr('session-id', "'" + $routeParams.sessionId + "'");
		directive.attr('selected-datasets', '[selectedDatasets[0]]');
		$compile(directive)($scope);
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
	};

	$scope.getDatasetUrl = function() {
		//TODO can Restangular build this?
		//TODO should we have separate read-only tokens for datasets?
		//TODO check if dataset(s) selected?
		return baseURLString
			+ 'filebroker/sessions/' + $routeParams.sessionId
			+ '/datasets/' + $scope.selectedDatasets[0].datasetId
			+ '?token=' + AuthenticationService.getToken();
	};
});