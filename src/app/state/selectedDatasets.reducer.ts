import Dataset from "../model/session/dataset";
import * as _ from "lodash";

export const TOGGLE_SELECTED_DATASET = 'TOGGLE_SELECTED_DATASET';
export const CLEAR_DATASET_SELECTIONS = 'CLEAR_DATASET_SELECTIONS';
export const SET_SELECTED_DATASETS = 'SET_SELECTED_DATASETS';

export const selectedDatasets = ( state: Array<Dataset> = [], {type, payload} ) => {

  const stateDatasets = state.slice();

  switch (type) {

    case SET_SELECTED_DATASETS:
      return payload;

    case TOGGLE_SELECTED_DATASET:
      _.forEach(payload, (payloadDataset: Dataset) => {
        const index = _.findIndex(stateDatasets, (dataset: Dataset) => dataset.datasetId === payloadDataset.datasetId );
        index === -1 ? stateDatasets.push(payload) : stateDatasets.splice(index, 1);
      });
      return stateDatasets;

    case CLEAR_DATASET_SELECTIONS:
      return [];

    default:
      return state;
  }

};
