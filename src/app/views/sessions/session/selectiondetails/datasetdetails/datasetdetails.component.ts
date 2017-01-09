import SelectionService from "../../selection.service";
import SessionDataService from "../../sessiondata.service";
import {Component, Inject, Output, EventEmitter} from "@angular/core";

@Component({
  selector: 'ch-dataset-details',
  templateUrl: './datasetdetails.html',
  styleUrls: ['./datasetdetails.less']
})
export class DatasetDetailsComponent {

  @Output() onDelete: EventEmitter<any> = new EventEmitter();

	constructor(
		private SelectionService: SelectionService,
		@Inject('SessionDataService') private SessionDataService: SessionDataService) {
	}

  deleteDatasets() {
    this.onDelete.emit();
  }

	exportDatasets() {
		this.SessionDataService.exportDatasets(this.SelectionService.selectedDatasets);
	}

	showHistory() {
		this.SessionDataService.openDatasetHistoryModal();
	}
}
