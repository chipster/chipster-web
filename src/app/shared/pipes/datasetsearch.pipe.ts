import { Pipe, PipeTransform } from '@angular/core';
import Dataset from "../../model/session/dataset";
import {PipeService} from "./pipeservice.service";

@Pipe({
  name: 'datasetsearch'
})
export class DatasetsearchPipe implements PipeTransform {

  constructor(private pipeService: PipeService){}

  transform(array: Dataset[], expression: string): any {
    return this.pipeService.findDataset(array, expression);
  }

}
