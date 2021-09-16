import { Pipe, PipeTransform } from "@angular/core";
import { Module } from "chipster-js-common";
import { PipeService } from "../services/pipeservice.service";

@Pipe({
  name: "modulepipe",
})
export class ModulePipe implements PipeTransform {
  constructor(private pipeService: PipeService) {}

  transform(modules: Array<Module>, searchWord: string) {
    return searchWord ? this.pipeService.findModulesContainingTool(modules, searchWord) : modules;
  }
}
