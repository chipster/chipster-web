import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";

class DatasetBoxComponent {

	static $inject = ['SelectionService', 'SessionDataService' ];

	onDelete: () => void;

	constructor(
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {
	}

	deleteDatasets() {
		this.onDelete();
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
	controller: DatasetBoxComponent,
	bindings: {
		onDelete: '&'
	}
}