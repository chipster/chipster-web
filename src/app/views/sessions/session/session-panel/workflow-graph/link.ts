import { DatasetNode } from "./dataset-node";
import Node from "./node";

export interface Link {
  source: DatasetNode;
  target: DatasetNode;
}
