
import {Injectable} from "@angular/core";
import Tool from "../../model/session/tool";
import Dataset from "../../model/session/dataset";
import Category from "../../model/session/category";
import Module from "../../model/session/module";
import * as _ from 'lodash';

@Injectable()
export class PipeService {

  constructor(){}

  findTools(tools: Array<Tool>, searchWord: string) {
    return searchWord ? tools.filter( (tool: Tool) => tool.name.displayName.toLowerCase().indexOf(searchWord.toLowerCase()) !== -1 ) : tools;
  }

  findDataset(datasets: Array<Dataset>, searchWord: string) {
    return searchWord ? datasets.filter( (item: Dataset) => item.name.toLowerCase().indexOf(searchWord.toLowerCase()) !== -1) : datasets;
  }

  /*
   * @description: find if tools-array contains a tool which name contains searchword given as parameter
   */
  containingToolBySearchWord(tools: Array<Tool>, searchWord: string) {
    const lowerCaseSearchWord = searchWord.toLowerCase();
    return _.some( tools, (tool: Tool) => tool.name.displayName.toLowerCase().indexOf(lowerCaseSearchWord) >= 0);
  }

  /*
   * @description: find categories containing at least one tool matching searchword
   */
  findCategoriesContainingTool(categories: Category[], searchWord: string): Array<Category> {
    return searchWord ? categories.filter( (category: Category) => this.containingToolBySearchWord(category.tools, searchWord)) : categories;
  }

  /*
   * @description: find modules containing at least one tool matching searchword
   */
  findModulesContainingTool(modules: Array<Module>, searchWord: string): Array<Module> {
    return searchWord ? modules.filter( (module: Module) => this.findCategoriesContainingTool(module.categories, searchWord).length > 0) : modules;
  }

}
