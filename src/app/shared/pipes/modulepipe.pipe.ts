import { Pipe, PipeTransform, inject } from "@angular/core";
import { Module } from "chipster-js-common";
import { PipeService } from "../services/pipeservice.service";

@Pipe({ name: "modulepipe" })
export class ModulePipe implements PipeTransform {
  private pipeService = inject(PipeService);

  transform(modules: Array<Module>, searchWord: string) {
    return searchWord ? this.pipeService.findModulesContainingTool(modules, searchWord) : modules;
  }
}
