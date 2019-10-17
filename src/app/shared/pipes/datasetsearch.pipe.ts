import { Pipe, PipeTransform } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { PipeService } from "../services/pipeservice.service";

@Pipe({
  name: "datasetsearch"
})
export class DatasetsearchPipe implements PipeTransform {
  constructor(private pipeService: PipeService) {}

  transform(array: Dataset[], expression: string): any {
    return this.pipeService.findDataset(array, expression);
  }
}
