import Job from "../model/session/job";
import * as _ from "lodash";

export const TOGGLE_SELECTED_JOB = 'TOGGLE_SELECTED_JOB';
export const CLEAR_JOB_SELECTIONS = 'CLEAR_JOB_SELECTIONS';
export const SET_SELECTED_JOBS = 'SET_SELECTED_JOBS';

export const selectedJobs = (state: Array<Job> = [], {type, payload}) => {

  const stateJobs = state.slice();

  switch (type) {

    case SET_SELECTED_JOBS:
      return payload;

    case TOGGLE_SELECTED_JOB:
      _.forEach(payload, (payloadJob: Job) => {
        const index = _.findIndex(stateJobs, (job: Job) => job.jobId === payloadJob.jobId);
        index === -1 ? stateJobs.push(payloadJob) : stateJobs.splice(index, 1);
      });
      return stateJobs;

    case CLEAR_JOB_SELECTIONS:
      return [];

    default:
      return state;
  }

};
