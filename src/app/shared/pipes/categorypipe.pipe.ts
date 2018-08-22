import { Pipe, PipeTransform } from '@angular/core';
import Category from "chipster-js-common";
import {PipeService} from "../services/pipeservice.service";

@Pipe({
  name: 'categorypipe'
})
export class CategoryPipe implements PipeTransform {

  constructor(private pipeService: PipeService) {}

  transform(categories: Array<Category>, searchWord: string): any {
    return this.pipeService.findCategoriesContainingTool(categories, searchWord);
  }

}
