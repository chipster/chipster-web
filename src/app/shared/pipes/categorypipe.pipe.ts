import { Pipe, PipeTransform } from '@angular/core';
import Category from "../../model/session/category";
import {PipeService} from "./pipeservice.service";

@Pipe({
  name: 'categorypipe'
})
export class CategorypipePipe implements PipeTransform {

  constructor(private pipeService: PipeService) {}

  transform(categories: Array<Category>, searchWord: string): any {
    this.pipeService.findCategoriesContainingTool(categories, searchWord);
  }

}
