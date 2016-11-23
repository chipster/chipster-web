import Dataset from "../../../../model/session/dataset";
import Node from './node';

export interface DatasetNode extends Node {
  dataset: Dataset;
  datasetId?: string;
  name: string;
  extension: string;
}
