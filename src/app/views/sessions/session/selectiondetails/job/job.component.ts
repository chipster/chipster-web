import SelectionService from "../../selection.service";
import SessionDataService from "../../sessiondata.service";
import {Component} from "@angular/core";

@Component({
  selector: 'ch-job',
  templateUrl: './job.html'
})
export class JobComponent {

	constructor(
		private SelectionService: SelectionService,
		private SessionDataService: SessionDataService) {
	}

	deleteJobs() {
		this.SessionDataService.deleteJobs(this.SelectionService.selectedJobs);
	}

	getJob() {
		return this.SelectionService.selectedJobs[0];
	}

	isJobSelected() {
		return this.SelectionService.selectedJobs.length > 0;
	}
}

