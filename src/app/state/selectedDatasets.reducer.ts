import { Dataset } from "chipster-js-common";
import { findIndex, forEach } from "lodash-es";

export const TOGGLE_SELECTED_DATASET = "TOGGLE_SELECTED_DATASET";
export const CLEAR_DATASET_SELECTIONS = "CLEAR_DATASET_SELECTIONS";
export const SET_SELECTED_DATASETS = "SET_SELECTED_DATASETS";

export function selectedDatasets(state: Array<Dataset> = [], { type, payload }) {
  const stateDatasets = state.slice();

  switch (type) {
    case SET_SELECTED_DATASETS:
      return payload;

    case TOGGLE_SELECTED_DATASET:
      forEach(payload, (payloadDataset: Dataset) => {
        const index = findIndex(stateDatasets, (dataset: Dataset) => dataset.datasetId === payloadDataset.datasetId);
        index === -1 ? stateDatasets.push(payloadDataset) : stateDatasets.splice(index, 1);
      });
      return stateDatasets;

    case CLEAR_DATASET_SELECTIONS:
      return [];

    default:
      return state;
  }
}
