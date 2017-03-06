import Dataset from "../model/session/dataset";
import Job from "../model/session/job";

export const TOGGLE_SELECTED_DATASET = 'TOGGLE_SELECTED_DATASET';
export const CLEAR_DATASET_SELECTIONS = 'CLEAR_DATASET_SELECTIONS';
export const TOGGLE_SELECTED_JOB = 'TOGGLE_SELECTED_JOB';
export const CLEAR_JOB_SELECTIONS = 'CLEAR_JOB_SELECTIONS';


export const datasetSelection = ( state: Array<Dataset> = [], {type, payload} ) => {

  const datasets = state.slice();

  switch (type) {

    case TOGGLE_SELECTED_DATASET:
      const index = _.findIndex(datasets, (dataset: Dataset) => dataset.datasetId === payload.datasetId );
      index === -1 ? datasets.push(payload) : datasets.splice(index, 1);
      return datasets;

    case CLEAR_DATASET_SELECTIONS:
      return [];

    default:
      return state;
  }

};

export const jobSelection = ( state: Array<Job> = [], {type, payload} ) => {

  const jobs = state.slice();

  switch (type) {

    case TOGGLE_SELECTED_JOB:
      const index = _.findIndex(jobs, (job: Job) => job.jobId === payload.jobId);
      index === undefined ? jobs.push(payload) : jobs.splice(index, 1);
      return jobs;

    case CLEAR_DATASET_SELECTIONS:
      return [];

    default:
      return state;
  }

};
