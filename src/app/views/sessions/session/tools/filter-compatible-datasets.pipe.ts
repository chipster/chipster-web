import { Pipe, PipeTransform } from '@angular/core';
import {ToolService} from "./tool.service";
import Dataset from "chipster-js-common";
import ToolInput from "chipster-js-common";
import {SessionData} from "../../../../model/session/session-data";


@Pipe({
  name: 'filterCompatibleDatasets'
})
export class FilterCompatibleDatasetsPipe implements PipeTransform {

  constructor(private toolService: ToolService) { }

  transform(datasets: Dataset[], toolInput: ToolInput, sessionData: SessionData): Dataset[] {

    if (datasets) {
      return datasets.filter(dataset => this.toolService.isCompatible(sessionData, dataset, toolInput.type.name));
    } else {
      console.warn("datasets is falsy");
      return [];
    }
  }
}
