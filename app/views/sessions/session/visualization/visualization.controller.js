

angular.module('chipster-web').controller('VisualizationCtrl',function(
	$scope, $routeParams, FileRestangular, AuthenticationService, $compile, Utils){

	$scope.setTab = function(value) {
		$scope.tab = value;
	};

	$scope.isTab = function(value) {
		return $scope.tab === value;
	};

	$scope.$watchCollection("selectedDatasets", function() {
		$scope.setTab(1);
		$scope.currentVisualization = undefined;
	});

	$scope.$on('showDefaultVisualization', function() {
		var visualizations = $scope.getVisualizations();
		if (visualizations.length > 0) {
			$scope.show(visualizations[0]);
		}
	});

	$scope.visualizations = [
		// when adding a new visualization, remember to include it (the directive) in the index.html file
		{
			directive: 'chipster-image',
			icon: 'glyphicon-picture',
			name: 'Image',
			extensions: ['png', "jpg", "jpeg"],
			preview: true,
			multipleDatasets: false
		},
		{
			directive: 'chipster-pdf',
			icon: 'glyphicon-book',
			name: 'PDF',
			extensions: ['pdf'],
			preview: true,
			multipleDatasets: false
		},
		{
			directive: 'chipster-spreadsheet',
			icon: 'glyphicon-th',
			name: 'Spreadsheet',
			extensions: ['tsv', 'bed'],
			preview: false,
			multipleDatasets: false
		},
		{
			directive: 'chipster-phenodata',
			icon: 'glyphicon-edit',
			name: 'Phenodata',
			extensions: ['tsv', 'bam'],
			preview: false,
			multipleDatasets: true
		},
		{
			directive: 'chipster-html',
			icon: 'glyphicon-globe',
			name: 'Html',
			extensions: ['html'],
			preview: true,
			multipleDatasets: false
		},
		{
			directive: 'chipster-text',
			icon: 'glyphicon-font',
			name: 'Text',
			extensions: ['txt', 'tsv', 'bed'],
			preview: false,
			multipleDatasets: false
		}
	];

	$scope.currentVisualization = null;


	$scope.isCompatibleWithDataset = function(visualization, dataset) {
		var extension = Utils.getFileExtension(dataset.name);
		return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
	};

	// check if the visualization is compatible with the selected dataset
	$scope.isCompatible = function (visualization, datasets) {
		if (datasets && datasets.length === 1) {
			return $scope.isCompatibleWithDataset(visualization, datasets[0]);

		} else if (datasets && datasets.length > 1 && visualization.multipleDatasets) {
			for (var i = 0; i < datasets.length; i++) {
				if (!$scope.isCompatibleWithDataset(visualization, datasets[i])) {
					return false;
				}
			}
			return true;
		}
		return false;
	};

	$scope.getVisualizations = function () {
		return $scope.visualizations.filter( function (visualization) {
			return $scope.isCompatible(visualization, $scope.selectedDatasets);
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
		directive.attr('selected-datasets', 'selectedDatasets');
		$compile(directive)($scope);
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
	};
});