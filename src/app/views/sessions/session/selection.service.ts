import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import * as _ from "lodash";
import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";

@Injectable()
export class SelectionService implements OnDestroy {
  // Selected datasets and jobs
  selectedDatasets: Array<Dataset>; // USE SELECTION-HANDLER SERVICE TO MODIFY
  selectedJobs: Array<Job>; // USE SELECTION-HANDLER SERVICE TO MODIFY

  selectedDatasets$: Observable<Array<Dataset>>;
  selectedJobs$: Observable<Array<Job>>;

  private unsubscribe: Subject<any> = new Subject();

  constructor(private store: Store<any>) {
    // Sync selected datasets from store
    this.selectedDatasets$ = this.store.select("selectedDatasets");
    this.store
      .select("selectedDatasets")
      .takeUntil(this.unsubscribe)
      .subscribe(
        (datasets: Array<Dataset>) => (this.selectedDatasets = datasets),
        (error: any) =>
          console.error("Error fetching datasets from store", error)
      );

    // Sync selected jobs from store
    this.selectedJobs$ = this.store.select("selectedJobs");
    this.store
      .select("selectedJobs")
      .takeUntil(this.unsubscribe)
      .subscribe((jobs: Array<Job>) => {
        this.selectedJobs = jobs;
      });
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
