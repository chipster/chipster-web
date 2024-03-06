import { uniq } from "lodash-es";

export default class VennDiagramSelection {
  datasetIds: Array<string> = [];
  values: Array<Array<string>> = [];

  addSelection(datasetIds: Array<string>, values: Array<Array<string>>) {
    this.datasetIds = uniq(this.datasetIds.concat(datasetIds));
    this.values = this.values.concat(values);
  }

  clearSelection() {
    this.datasetIds.length = 0;
    this.values.length = 0;
  }
}
