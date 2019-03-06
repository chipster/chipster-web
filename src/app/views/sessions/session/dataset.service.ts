import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";

@Injectable()
export class DatasetService {
  hasPhenodata(dataset: Dataset) {
    return dataset.metadata && dataset.metadata.length > 0;
  }
}
