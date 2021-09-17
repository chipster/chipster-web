import { Pipe, PipeTransform } from "@angular/core";
import { Dataset, ToolInput } from "chipster-js-common";
import { ToolService } from "./tool.service";
import { SessionData } from "../../../../model/session/session-data";

@Pipe({
  name: "filterCompatibleDatasets",
})
export class FilterCompatibleDatasetsPipe implements PipeTransform {
  constructor(private toolService: ToolService) {}

  transform(datasets: Dataset[], toolInput: ToolInput, sessionData: SessionData): Dataset[] {
    if (datasets) {
      return datasets.filter((dataset) => this.toolService.isCompatible(sessionData, dataset, toolInput.type.name));
    } 
      console.warn("datasets is falsy");
      return [];
    
  }
}
