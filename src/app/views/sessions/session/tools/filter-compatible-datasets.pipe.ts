import { Pipe, PipeTransform } from '@angular/core';
import {ToolService} from "./tool.service";
import Dataset from "../../../../model/session/dataset";
import ToolInput from "../../../../model/session/toolinput";


@Pipe({
  name: 'filterCompatibleDatasets'
})
export class FilterCompatibleDatasetsPipe implements PipeTransform {

  constructor(private toolService: ToolService) { }

  transform(datasets: Dataset[], toolInput: ToolInput): Dataset[] {

    if (datasets) {
      return datasets.filter(dataset => this.toolService.isCompatible(dataset, toolInput.type.name));
    } else {
      console.warn("datasets is falsy");
      return [];
    }
  }
}
