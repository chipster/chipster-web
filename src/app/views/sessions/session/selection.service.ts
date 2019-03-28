
import {takeUntil} from 'rxjs/operators';
import { Dataset } from "chipster-js-common";
import { Job } from "chipster-js-common";
import * as _ from "lodash";
import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { BehaviorSubject ,  Observable ,  Subject } from "rxjs";
import { ErrorService } from "../../../core/errorhandler/error.service";

@Injectable()
export class SelectionService implements OnDestroy {
  // Selected datasets and jobs
  selectedDatasets: Array<Dataset>; // USE SELECTION-HANDLER SERVICE TO MODIFY
  selectedJobs: Array<Job>; // USE SELECTION-HANDLER SERVICE TO MODIFY

  selectedDatasets$: Observable<Array<Dataset>>;
  selectedJobs$: Observable<Array<Job>>;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private store: Store<any>,
    private errorService: ErrorService,
  ) {
    // Sync selected datasets from store
    this.selectedDatasets$ = this.store.select("selectedDatasets");
    this.store
      .select("selectedDatasets").pipe(
      takeUntil(this.unsubscribe))
      .subscribe(
        (datasets: Array<Dataset>) => (this.selectedDatasets = datasets),
        (error: any) => this.errorService.showError("Error fetching datasets from store", error)
      );

    // Sync selected jobs from store
    this.selectedJobs$ = this.store.select("selectedJobs");
    this.store
      .select("selectedJobs").pipe(
      takeUntil(this.unsubscribe))
      .subscribe((jobs: Array<Job>) => {
        this.selectedJobs = jobs;
      }, err => this.errorService.showError("Error fetching selected jobs from store", err));
  }

  isJobSelected(): boolean {
    return this.selectedJobs.length > 0;
  }

  /*
     * @description: search by dataset object if given dataset is currently selected
     */
  isSelectedDataset(dataset: Dataset): boolean {
    return this.isSelectedDatasetById(dataset.datasetId);
  }

  /*
     * @description: search by id if given dataset is currently selected
     */
  isSelectedDatasetById(datasetId: string): boolean {
    return _.some(
      this.selectedDatasets,
      (dataset: Dataset) => dataset.datasetId === datasetId
    );
  }

  isSelectedJobById(jobId: string): boolean {
    return _.some(this.selectedJobs, (job: Job) => job.jobId === jobId);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
