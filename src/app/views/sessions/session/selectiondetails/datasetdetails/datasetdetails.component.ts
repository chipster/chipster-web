import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { Component, Output, EventEmitter, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { Dataset } from "chipster-js-common";
import { ErrorService } from "../../../../../core/errorhandler/error.service";

@Component({
  selector: "ch-dataset-details",
  templateUrl: "./datasetdetails.html",
  styleUrls: ["./datasetdetails.less"]
})
export class DatasetDetailsComponent implements OnInit {
  @Output() onDelete: EventEmitter<any> = new EventEmitter();

  datasets: Array<Dataset>;

  constructor(
    public selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private store: Store<any>,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    const datasets$ = this.store.select("selectedDatasets");
    datasets$.subscribe(
      (datasets: Array<Dataset>) => {
        this.datasets = datasets;
      },
      err =>
        this.errorService.showError(
          "failed to get the selected datasets from store",
          err
        )
    );
  }

  deleteDatasets() {
    this.onDelete.emit();
  }

  exportDatasets() {
    this.sessionDataService.exportDatasets(
      this.selectionService.selectedDatasets
    );
  }
}
