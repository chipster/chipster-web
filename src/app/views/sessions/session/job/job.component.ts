import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";
import {Component, Inject} from "@angular/core";

@Component({
  selector: 'ch-job',
  templateUrl: './job.html'
})
export class JobComponent {

	constructor(
		private SelectionService: SelectionService,
		@Inject('SessionDataService') private SessionDataService: SessionDataService) {
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

