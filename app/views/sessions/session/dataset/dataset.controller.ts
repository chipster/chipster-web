
import VisualizationList from "./../visualization/visualizationconstants";

export default function ($scope, $routeParams, AuthenticationService, $compile, Utils) {
	$scope.visualizations = VisualizationList;

	$scope.$watchCollection("selectedDatasets", function () {
		$scope.setTab(1);
		$scope.setCurrentVisualization(undefined);
	});
	$scope.setCurrentVisualization = function (newVisualization, directive) {
		if ($scope.currentVisualizationDirective) {
			$scope.currentVisualizationDirective.remove();
		}
		$scope.currentVisualization = newVisualization;
		$scope.currentVisualizationDirective = directive;
	};
	$scope.$on('showDefaultVisualization', function () {
		var visualizations = $scope.getVisualizations();
		if (visualizations.length > 0) {
			$scope.show(visualizations[0]);
		}
	});

	$scope.setCurrentVisualization(undefined);
	$scope.isCompatibleWithDataset = function (visualization, dataset) {
		var extension = Utils.getFileExtension(dataset.name);
		return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
	};
	$scope.isCompatible = function (visualization, datasets) {
		if (datasets && datasets.length === 1) {
			return $scope.isCompatibleWithDataset(visualization, datasets[0]);
		}
		else if (datasets && datasets.length > 1 && visualization.multipleDatasets) {
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
		return $scope.visualizations.filter(function (visualization) {
			return $scope.isCompatible(visualization, $scope.selectedDatasets);
		});
	};
	$scope.showPreview = function () {
		var visualizations = $scope.getVisualizations();
		return visualizations.length === 1 && visualizations[0].preview;
	};
	$scope.show = function (vis) {
		if (!$scope.isSingleDatasetSelected) {
			console.log("trying to show visualization, but " + $scope.selectedDatasets.length + " datasets selected");
			return;
		}
		var directive = angular.element('<' + vis.directive + '/>');
		directive.attr('src', 'getDatasetUrl()');
		directive.attr('dataset-id', 'selectedDatasets[0].datasetId');
		directive.attr('session-id', "'" + $routeParams.sessionId + "'");
		directive.attr('selected-datasets', 'selectedDatasets');
		$compile(directive)($scope);
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
		$scope.setTab(2);
		$scope.setCurrentVisualization(vis, directive);
	};
};
