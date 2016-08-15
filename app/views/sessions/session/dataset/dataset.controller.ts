import VisualizationList from "./../visualization/visualizationconstants";
import Utils from "../../../../services/utils.service";
import AuthenticationService from "../../../../authentication/authenticationservice";
import Visualization from "../visualization/visualization";
import Dataset from "../../../../model/session/dataset";
import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";

export default class DatasetController {

	static $inject = [
		'$scope', '$routeParams', 'AuthenticationService', '$compile', 'SelectionService',
		'SessionDataService'];

	constructor(
		private $scope: ng.IScope,
		private $routeParams: ng.route.IRouteParamsService,
		private AuthenticationService: AuthenticationService,
		private $compile: ng.ICompileService,
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {

		this.init();
	}

	visualizations: Visualization[] = VisualizationList;
	currentVisualization: Visualization = null;
	currentVisualizationDirective: any = null;

	init() {

		this.$scope.$watchCollection("selectedDatasets", function () {
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

		let datasets = this.SelectionService.selectedDatasets;

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
		if (!this.SelectionService.isSingleDatasetSelected()) {
			console.log("trying to show visualization, but " + this.SelectionService.selectedDatasets.length + " datasets selected");
			return;
		}
		var directive = angular.element('<' + vis.directive + '/>');
		directive.attr('src', 'vm.getDatasetUrl()');
		directive.attr('dataset-id', 'vm.getDataset().datasetId');
		directive.attr('session-id', "'" + this.SessionDataService.sessionId + "'");
		directive.attr('selected-datasets', 'vm.getSelectionService().selectedDatasets');
		this.$compile(directive)(this.$scope);
		var area = angular.element(document.getElementById("visualizationArea"));
		area.empty();
		area.append(directive);
		this.setCurrentVisualization(vis, directive);
	}

	renameDataset() {
		this.SessionDataService.renameDatasetDialog(this.SelectionService.selectedDatasets[0]);
	}

	deleteDatasets() {
		this.SessionDataService.deleteDatasets(this.SelectionService.selectedDatasets);
	}

	exportDatasets() {
		this.SessionDataService.exportDatasets(this.SelectionService.selectedDatasets);
	}

	showHistory() {
		this.SessionDataService.openDatasetHistoryModal();
	}

	getSelectionService() {
		return this.SelectionService;
	}

	getSourceJob() {
		if (this.getSelectionService().selectedDatasets[0]) {
			return this.SessionDataService.getJob(this.getSelectionService().selectedDatasets[0].sourceJob)
		}
		return null;
	}

	getDataset() {
		return this.SelectionService.selectedDatasets[0];
	}

	getDatasetUrl() {
		return this.SessionDataService.getDatasetUrl(this.getDataset());
	}
}
