import { Injectable } from "@angular/core";
import { Tool, Dataset, Category, Module } from "chipster-js-common";
import * as _ from "lodash";

@Injectable()
export class PipeService {
  constructor() {}

  findTools(tools: Array<Tool>, searchWord: string) {
    return searchWord
      ? tools.filter((tool: Tool) => tool.name.displayName.toLowerCase().includes(searchWord.toLowerCase()))
      : tools;
  }

  findDataset(datasets: Array<Dataset>, searchWord: string) {
    return searchWord
      ? datasets.filter((item: Dataset) => item.name.toLowerCase().includes(searchWord.toLowerCase()))
      : datasets;
  }

  /*
   * @description: find if tools-array contains a tool which name contains searchword given as parameter
   */
  containingToolBySearchWord(tools: Array<Tool>, searchWord: string) {
    const lowerCaseSearchWord = searchWord.toLowerCase();
    return _.some(tools, (tool: Tool) => tool.name.displayName.toLowerCase().includes(lowerCaseSearchWord));
  }

  /*
   * @description: find categories containing at least one tool matching searchword
   */
  findCategoriesContainingTool(categories: Category[], searchWord: string): Array<Category> {
    return searchWord
      ? categories.filter((category: Category) => this.containingToolBySearchWord(category.tools, searchWord))
      : categories;
  }

  /*
   * @description: find modules containing at least one tool matching searchword
   */
  findModulesContainingTool(modules: Array<Module>, searchWord: string): Array<Module> {
    return searchWord
      ? modules.filter((module: Module) => this.findCategoriesContainingTool(module.categories, searchWord).length > 0)
      : modules;
  }
}
