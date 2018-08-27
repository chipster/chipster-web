import { Dataset } from "chipster-js-common";
import Node from './node';

export interface DatasetNode extends Node {
  dataset: Dataset;
  datasetId?: string;
  name: string;
  extension: string;
}
