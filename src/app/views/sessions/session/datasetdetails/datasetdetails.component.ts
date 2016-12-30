import SelectionService from "../selection.service";
import SessionDataService from "../sessiondata.service";
import {Component, Inject, Output, Directive, EventEmitter, ElementRef, Injector} from "@angular/core";
import {UpgradeComponent} from "@angular/upgrade/src/aot/upgrade_component";

@Component({
  selector: 'ch-dataset-details',
  templateUrl: './datasetdetails.html',
  styleUrls: ['./datasetdetails.less']
})
export class DatasetDetailsComponent {

  @Output() onDelete: EventEmitter<> = new EventEmitter();

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
