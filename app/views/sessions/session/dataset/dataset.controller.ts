import VisualizationList from "./../visualization/visualizationconstants";
import Utils from "../../../../services/Utils";
import AuthenticationService from "../../../../authentication/authenticationservice";
import IScopeService = angular.IScopeService;
import IRouteParamsService = angular.IRouteParamsService;
import ICompileService = angular.ICompileService;
import Visualization from "../visualization/visualization";
import Dataset from "../model/dataset";

export default class DatasetController {

	static $inject = ['$scope', '$routeParams', 'AuthenticationService', '$compile'];

	constructor(
		private $scope: IScopeService,
		private $routeParams: IRouteParamsService,
		private AuthenticationService: AuthenticationService,
		private $compile: ICompileService) {

		this.init();
	}

	visualizations: Visualization[] = VisualizationList;
	currentVisualization: Visualization = null;
	currentVisualizationDirective: any = null;

	init() {

		this.$scope.$watchCollection("selectedDatasets", function () {
			this.$scope.setTab(1);
			this.setCurrentVisualization(undefined);
		}.bind(this));

		this.$scope.$on('showDefaultVisualization', function () {
			var visualizations = this.getVisualizations();
			if (visualizations.length > 0) {
				this.show(visualizations[0]);
			}
		}.bind(this));

		this.setCurrentVisualization(null, null);
	}

	setCurrentVisualization(newVisualization: Visualization, directive: any) {

		if (this.currentVisualizationDirective) {
			this.currentVisualizationDirective.remove();
		}
		this.currentVisualization = newVisualization;
		this.currentVisualizationDirective = directive;
	}

	static isCompatibleWithDataset(visualization: Visualization, dataset: Dataset) {

		var extension = Utils.getFileExtension(dataset.name);
		return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
	}

	isCompatible(visualization: Visualization) {

		let datasets = this.$scope.selectedDatasets;

		if (datasets && datasets.length === 1) {
			return DatasetController.isCompatibleWithDataset(visualization, datasets[0]);
		}
		else if (datasets && datasets.length > 1 && visualization.multipleDatasets) {
			for (var i = 0; i < datasets.length; i++) {
				if (!DatasetController.isCompatibleWithDataset(visualization, datasets[i])) {
					return false;
				}
			}
			return true;
		}
		return false;
	}

	getVisualizations() {
		return this.visualizations.filter(function (visualization: Visualization) {
			return this.isCompatible(visualization);
		}.bind(this));
	}

	showPreview() {
		var visualizations = this.getVisualizations();
		return visualizations.length === 1 && visualizations[0].preview;
	}

	show(vis: Visualization) {
		if (!this.$scope.isSingleDatasetSelected) {
			console.log("trying to show visualization, but " + this.$scope.selectedDatasets.length + " datasets selected");
			return;
		}
		var directive = angular.element('<' + vis.directive + '/>');
		directive.attr('src', 'getDatasetUrl()');
		directive.attr('dataset-id', 'selectedDatasets[0].datasetId');
		directive.attr('session-id', "'" + this.$scope.getSessionId() + "'");
		directive.attr('selected-datasets', 'selectedDatasets');
		this.$compile(directive)(this.$scope);
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
		this.$scope.setTab(2);
		this.setCurrentVisualization(vis, directive);
	}

	renameDataset() {
		this.$scope.renameDatasetDialog(this.$scope.selectedDatasets[0]);
	}

	deleteDatasets() {
		this.$scope.deleteDatasets(this.$scope.selectedDatasets);
	}

	exportDatasets() {
		this.$scope.exportDatasets(this.$scope.selectedDatasets);
	}

	showHistory() {
		this.$scope.openDatasetHistoryModal();
	}
}
