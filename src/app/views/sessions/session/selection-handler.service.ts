import {Injectable} from '@angular/core';
import {Subject, Observable} from "rxjs";
import Dataset from "../../../model/session/dataset";
import {Store} from "@ngrx/store";
import {
  TOGGLE_SELECTED_DATASET, CLEAR_DATASET_SELECTIONS,
  SET_SELECTED_DATASETS
} from "../../../state/selectedDatasets.reducer";
import Job from "../../../model/session/job";
import {TOGGLE_SELECTED_JOB, CLEAR_JOB_SELECTIONS, SET_SELECTED_JOBS} from "../../../state/selectedJobs.reducer";

@Injectable()
export class SelectionHandlerService {

  selectedDatasets: Array<Dataset>;
  selectedJobs: Array<Job>;

  // Streams for handling state in global store. These streams are meant to carry the
  // information on what datasets are being selected and deselected
  toggleDatasetSelection$ = new Subject();
  setDatasetSelection$ = new Subject();
  clearDatasetSelections$ = new Subject();

  // Streams for handling state in global store. These streams are meant to carry the
  // information on what jobs are being selected and deselected
  setJobSelection$ = new Subject();
  toggleJobSelection$ = new Subject();
  clearJobSelections$ = new Subject();

  constructor(private store: Store<any>) {

    // Setup state actionlisteners
    Observable.merge(

      // Dataset actions
      this.setDatasetSelection$.map((datasets: Array<Dataset>) => ({type: SET_SELECTED_DATASETS, payload: datasets})),
      this.toggleDatasetSelection$.map((datasets: Array<Dataset>) => ({type: TOGGLE_SELECTED_DATASET, payload: datasets})),
      this.clearDatasetSelections$.map(() => ({type: CLEAR_DATASET_SELECTIONS})),

      // Job actions
      this.setJobSelection$.map( (jobs: Array<Job>) => ({type: SET_SELECTED_JOBS, payload: jobs})),
      this.toggleJobSelection$.map((jobs: Array<Job>) => ({type: TOGGLE_SELECTED_JOB, payload: jobs})),
      this.clearJobSelections$.map(() => ({type: CLEAR_JOB_SELECTIONS}))

    ).subscribe(this.store.dispatch.bind(this.store));
  }

  /*
   * @description: clear dataset & job selections from store
   */
  clearSelections(): void {
    this.clearDatasetSelection();
    this.clearJobSelection();
  }

  /*
   * @description: for each dataset-item in datasets: add dataset to store if it's not there and otherwise remove it
   */
  toggleDatasetSelection(datasets: Array<Dataset>): void {
    this.toggleDatasetSelection$.next(datasets);
  }

  /*
   * @description: clear existing datasets and set given dataset list to store
   */
  setDatasetSelection(datasets: Array<Dataset>): void {
    this.clearJobSelection();
    this.setDatasetSelection$.next(datasets);
  }

  /*
   * @description: clear dataset selections from store
   */
  clearDatasetSelection(): void {
    this.clearDatasetSelections$.next();
  }

  /*
   * @description: clear all selections and set new job selection to store
   */
  setJobSelection(jobs: Array<Job>): void {
    this.clearDatasetSelection();
    this.setJobSelection$.next(jobs);
  }

  /*
   * @description: for each job-item in jobs: add job to store if it's not there and otherwise remove it
   */
  toggleJobSelection(jobs: Array<Job>): void {
    this.toggleJobSelection$.next(jobs);
  }

  /*
   * @description: clear dataset selections from store
   */
  clearJobSelection(): void {
    this.clearJobSelections$.next();
  }

}
