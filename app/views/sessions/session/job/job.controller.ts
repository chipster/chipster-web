import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";

export default class JobController {

	static $inject = ['SelectionService', 'SessionDataService'];

	constructor(
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {
	}

	deleteJobs() {
		this.SessionDataService.deleteJobs(this.SelectionService.selectedJobs);
	}

	getSelectionService() {
		return this.SelectionService;
	}

	getJob() {
		return this.SelectionService.selectedJobs[0];
	}

	isJobSelected() {
		return this.SelectionService.selectedJobs.length > 0;
	}
}
