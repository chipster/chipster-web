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

	$scope.$watch("dataNode", function(newValue, oldValue) {
		$scope.setTab(1);
	});

	$scope.visualizations = [
		// when adding a new visualization, remember to include it in the index.html file
		{
			directive: 'chipster-image',
			icon: 'glyphicon-picture',
			name: 'Image',
			extensions: ['png', "jpg", "jpeg"]
		},
		{
			directive: 'chipster-pdf',
			icon: 'glyphicon-book',
			name: 'PDF',
			extensions: ['pdf']
		},
		{
			directive: 'chipster-spreadsheet',
			icon: 'glyphicon-th',
			name: 'Spreadsheet',
			extensions: ['tsv', 'bed']
		},
		{
			directive: 'chipster-Phenodata',
			icon: 'glyphicon-edit',
			name: 'Text',
			extensions: ['tsv']
		},
		{
			directive: 'chipster-text',
			icon: 'glyphicon-font',
			name: 'Text',
			extensions: ['txt', 'tsv', 'bed']
		},
	];

	// check if the visualization is compatible with the selected dataset
	$scope.isCompatible = function (visualization) {
		if ($scope.dataNode) {
			var extension = $scope.dataNode.name.split('.').pop();
			return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
		}
		return false;
	};

	// compile the selected visualization directive and show it
	$scope.show = function (directiveName) {
		console.log(directiveName);
		$scope.setTab(2);
		var directive = angular.element('<' + directiveName + '/>');
		directive.attr('src', "'" + $scope.getDatasetUrl() + "'");
		directive.attr('dataset-id', "'" + $scope.dataNode.datasetId + "'");
		directive.attr('session-id', "'" + $routeParams.sessionId + "'");
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
		$compile(directive)($scope);
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