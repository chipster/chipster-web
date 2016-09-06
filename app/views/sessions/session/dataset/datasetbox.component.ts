import VisualizationList from "./../visualization/visualizationconstants";
import Utils from "../../../../services/utils.service";
import Visualization from "../visualization/visualization";
import Dataset from "../../../../model/session/dataset";
import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";
import Job from "../../../../model/session/job";

class DatasetBoxComponent {

	static $inject = ['SelectionService', 'SessionDataService' ];

    private datasets: Array<Dataset>;

	constructor(
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {
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

	getSourceJob(dataset: Dataset) {
        return this.SessionDataService.getJobById(dataset.sourceJob, this.jobs);
	}

	getDatasetUrl() {
		if (this.SelectionService.selectedDatasets.length > 0) {
			return this.SessionDataService.getDatasetUrl(this.getDataset());
		}
	}
}

export default {
	bindings: {
        datasets: '<'
	},
	templateUrl: 'views/sessions/session/dataset/dataset.html',
	controller: DatasetBoxComponent
}