import { Injectable } from "@angular/core";
import { Dataset, Job } from "chipster-js-common";
import { Store } from "@ngrx/store";
import {
  TOGGLE_SELECTED_DATASET,
  CLEAR_DATASET_SELECTIONS,
  SET_SELECTED_DATASETS,
} from "../../../state/selectedDatasets.reducer";
import { TOGGLE_SELECTED_JOB, CLEAR_JOB_SELECTIONS, SET_SELECTED_JOBS } from "../../../state/selectedJobs.reducer";
import { CLEAR_SELECTED_TOOL } from "../../../state/tool.reducer";

/*
 * Functions for changing selection states. The state is stored in @ngrx/store.
 *
 */
@Injectable()
export class SelectionHandlerService {
  constructor(private store: Store<any>) {}

  /*
   * @description: clear dataset & job & tool selections from store
   */
  clearSelections(): void {
    this.clearDatasetSelection();
    this.clearJobSelection();
    this.clearToolSelection();
  }

  /*
   * @description: clear existing datasets and set given dataset list to store
   */
  setDatasetSelection(datasets: Array<Dataset>): void {
    this.clearJobSelection();
    this.store.dispatch({ type: SET_SELECTED_DATASETS, payload: datasets });
  }

  /*
   * @description: for each dataset-item in datasets: add dataset to store if it's not there and otherwise remove it
   */
  toggleDatasetSelection(datasets: Array<Dataset>): void {
    this.store.dispatch({ type: TOGGLE_SELECTED_DATASET, payload: datasets });
  }

  clearDatasetSelection(): void {
    this.store.dispatch({ type: CLEAR_DATASET_SELECTIONS });
  }

  /*
   * @description: clear all selections and set new job selection to store
   */
  setJobSelection(jobs: Array<Job>): void {
    this.store.dispatch({ type: SET_SELECTED_JOBS, payload: jobs });
  }

  /*
   * @description: for each job-item in jobs: add job to store if it's not there and otherwise remove it
   */
  // noinspection JSUnusedGlobalSymbols
  toggleJobSelection(jobs: Array<Job>): void {
    this.store.dispatch({ type: TOGGLE_SELECTED_JOB, payload: jobs });
  }

  clearJobSelection(): void {
    this.store.dispatch({ type: CLEAR_JOB_SELECTIONS });
  }

  clearToolSelection() {
    this.store.dispatch({ type: CLEAR_SELECTED_TOOL });
  }
}
