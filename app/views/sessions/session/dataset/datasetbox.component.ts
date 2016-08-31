import VisualizationList from "./../visualization/visualizationconstants";
import Utils from "../../../../services/utils.service";
import AuthenticationService from "../../../../authentication/authenticationservice";
import Visualization from "../visualization/visualization";
import Dataset from "../../../../model/session/dataset";
import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";
import Job from "../../../../model/session/job";

class DatasetBoxComponent {

	static $inject = [
		'$scope', '$routeParams', 'AuthenticationService', '$compile', 'SelectionService',
		'SessionDataService'];

	private jobs: Job[];
	private datasetSelection: Dataset;

	constructor(
		private $scope: ng.IScope,
		private $routeParams: ng.route.IRouteParamsService,
		private AuthenticationService: AuthenticationService,
		private $compile: ng.ICompileService,
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {
	}

    $onInit() {
        // A dataset should be selected from workflow when this component is initialized. Set it as selected by default.
        this.datasetSelection = this.SelectionService.selectedDatasets[0];
    }

	// Used in datasetBox to select one dataset and view information about it (not to be mixed with dataset selections in workflow)
	setDatasetBoxDatasetSelection(dataset: Dataset) {
		this.datasetSelection = dataset;
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

	getSourceJob() {
		if (this.SelectionService.selectedDatasets[0]) {
			return this.SessionDataService.getJobById(this.SelectionService.selectedDatasets[0].sourceJob, this.jobs);
		}
		return null;
	}

	getDatasetUrl() {
		if (this.SelectionService.selectedDatasets.length > 0) {
			return this.SessionDataService.getDatasetUrl(this.getDataset());
		}
	}
}

export default {
	bindings: {
		jobs: '<'
	},
	templateUrl: 'views/sessions/session/dataset/dataset.html',
	controller: DatasetBoxComponent
}