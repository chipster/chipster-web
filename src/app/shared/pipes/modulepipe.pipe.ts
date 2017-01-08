import { Pipe, PipeTransform } from '@angular/core';
import Module from "../../model/session/module";
import {PipeService} from "./pipeservice.service";

@Pipe({
  name: 'modulepipe'
})
export class ModulepipePipe implements PipeTransform {

  constructor(private pipeService: PipeService) {}

  transform(modules: Array<Module>, searchWord: string){
    if(!searchWord)
      return modules;

    var result: Module[] = [];

    modules.forEach((module) => {
      var filteredTools = $filter('categoryFilter')(module.categories, searchWord);

      if(filteredTools.length > 0){
        result.push(module);
      }
    });

    return result;
  }

}
