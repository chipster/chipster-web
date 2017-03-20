import {SelectionService} from "../../selection.service";
import {SessionDataService} from "../../sessiondata.service";
import {Component, Output, EventEmitter} from "@angular/core";
import {Store} from "@ngrx/store";
import Dataset from "../../../../../model/session/dataset";

@Component({
  selector: 'ch-dataset-details',
  templateUrl: './datasetdetails.html',
  styleUrls: ['./datasetdetails.less']
})
export class DatasetDetailsComponent {

  @Output() onDelete: EventEmitter<any> = new EventEmitter();

  datasets: Array<Dataset>;

	constructor(
		private selectionService: SelectionService,
		private SessionDataService: SessionDataService,
    private store: Store<any>) {}

	ngOnInit() {
	  const datasets$ = this.store.select('selectedDatasets');
	  datasets$.subscribe( (datasets: Array<Dataset>) => {
      this.datasets = datasets;
    });
  }

  isSelectedDataset(datasetId: string) {
	  return _.some( this.datasets, (dataset: Dataset) => dataset.datasetId === datasetId );
  }

  deleteDatasets() {
    this.onDelete.emit();
  }

	exportDatasets() {
		this.SessionDataService.exportDatasets(this.selectionService.selectedDatasets);
	}
}
