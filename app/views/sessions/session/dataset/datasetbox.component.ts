import VisualizationList from "./../visualization/visualizationconstants";
import Utils from "../../../../services/utils.service";
import Visualization from "../visualization/visualization";
import Dataset from "../../../../model/session/dataset";
import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";
import Job from "../../../../model/session/job";

class DatasetBoxComponent {

	static $inject = ['SelectionService', 'SessionDataService' ];

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
}

export default {
	templateUrl: 'views/sessions/session/dataset/dataset.html',
	controller: DatasetBoxComponent
}