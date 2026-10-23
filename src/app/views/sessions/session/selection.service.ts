import { Dataset, Job } from "chipster-js-common";
import { some } from "lodash-es";
import { Injectable, inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class SelectionService {
  private store = inject<Store<any>>(Store);

  // Selected datasets and jobs. USE SELECTION-HANDLER SERVICE TO MODIFY
  private readonly selectedDatasetsSignal = this.store.selectSignal<Array<Dataset>>((state) => state.selectedDatasets);
  private readonly selectedJobsSignal = this.store.selectSignal<Array<Job>>((state) => state.selectedJobs);

  selectedDatasets$: Observable<Array<Dataset>> = this.store.select("selectedDatasets");
  selectedJobs$: Observable<Array<Job>> = this.store.select("selectedJobs");

  /*
   * Getters of signals, so that the views that read the selection, also through the methods below,
   * are notified when it changes, like the List tab when a file is selected in the workflow graph
   */
  get selectedDatasets(): Array<Dataset> {
    return this.selectedDatasetsSignal();
  }

  get selectedJobs(): Array<Job> {
    return this.selectedJobsSignal();
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
    return some(this.selectedDatasets, (dataset: Dataset) => dataset.datasetId === datasetId);
  }

  isSelectedJobById(jobId: string): boolean {
    return some(this.selectedJobs, (job: Job) => job.jobId === jobId);
  }
}
