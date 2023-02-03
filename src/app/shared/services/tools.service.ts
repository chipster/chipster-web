import { Injectable } from "@angular/core";
import { Category, Module, Tool } from "chipster-js-common";
import { forkJoin, Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { ToolResource } from "../resources/tool-resource";
import UtilsService from "../utilities/utils";
import { ConfigService } from "./config.service";

@Injectable()
export class ToolsService {
  private toolsCache$: Observable<Tool[]>;
  private modulesCache$: Observable<Module[]>;
  private modulesMapCache$: Observable<Map<string, Module>>;

  constructor(private toolResource: ToolResource, private configService: ConfigService) {}

  getTools(): Observable<Tool[]> {
    if (!this.toolsCache$) {
      this.toolsCache$ = this.toolResource.getTools().pipe(shareReplay(1));
    }
    return this.toolsCache$;
  }

  getModules(): Observable<Module[]> {
    if (!this.modulesCache$) {
      this.modulesCache$ = forkJoin(
        this.configService.getModules(), // names of the enabled modules
        this.toolResource.getModules() // all modules from the server
      ).pipe(
        map((results) => {
          const enabledModules: string[] = results[0];
          const allModules: Module[] = results[1];
          return allModules
            .filter((module: Module) => enabledModules.includes(module.name))
            .map((module: Module) => {
              // set moduleId
              module.moduleId = module.name.toLowerCase();

              // create categoriesMap
              module.categoriesMap = UtilsService.arrayToMap(module.categories, "name");

              return module;
            });
        }),
        shareReplay(1)
      );
    }
    return this.modulesCache$;
  }

  getModulesMap(): Observable<Map<string, Module>> {
    if (!this.modulesMapCache$) {
      this.modulesMapCache$ = this.getModules().pipe(
        map((modules: Module[]) => UtilsService.arrayToMap(modules, "moduleId")),
        shareReplay(1)
      );
    }
    return this.modulesMapCache$;
  }

  categoryContainsToolId(category: Category, toolId: string): boolean {
    return (
      category != null &&
      category.tools != null &&
      category.tools.some((toolInCategory: Tool) => toolInCategory.name.id === toolId)
    );
  }
}
