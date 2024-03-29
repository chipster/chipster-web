import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Category, Module, Tool } from "chipster-js-common";
import { cloneDeep } from "lodash-es";
import { Subject } from "rxjs";
import { SessionData } from "../../../../../model/session/session-data";
import { SearchBoxComponent } from "../../../../../shared/components/search-box/search-box.component";
import { CategoryPipe } from "../../../../../shared/pipes/categorypipe.pipe";
import { ModulePipe } from "../../../../../shared/pipes/modulepipe.pipe";
import { ToolPipe } from "../../../../../shared/pipes/toolpipe.pipe";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import { ToolSelectionService } from "../../tool.selection.service";

@Component({
  selector: "ch-tool-list-accordion",
  templateUrl: "./tool-list-accordion.component.html",
  styleUrls: ["./tool-list-accordion.component.less"],
})
export class ToolListAccordionComponent implements OnInit {
  @Input()
  private sessionData: SessionData;
  @Input()
  private toolsArray: Tool[];
  @Input()
  private modulesArray: Module[];

  // FIXME after tool state refactoring
  // @Input()
  // private toolSelection: ToolSelection;

  // FIXME after tool state refactoring
  // @Output()
  // private selectToolOutput = new EventEmitter<ToolSelection>();

  @ViewChild("searchBox")
  private searchBox: SearchBoxComponent;

  modules: Array<Module> = [];
  tools: Array<Tool> = [];

  searchTool: string;

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  selectTool$ = new Subject();

  constructor(
    private pipeService: PipeService,
    private toolSelectionService: ToolSelectionService,
  ) {}

  ngOnInit() {
    // TODO why copies?
    this.tools = cloneDeep(this.toolsArray);
    this.modules = cloneDeep(this.modulesArray);

    // FIXME after tool state refactoring
    // trigger parameter validation
    //    if (this.toolSelection) {
    //      // make sure the module and category are selected even after changing the session
    //      this.selectModule(this.toolSelection.module);
    //      this.selectCategory(this.toolSelection.category);
    //      this.selectTool(this.toolSelection.tool);
    //    } else {
    //      this.selectModule(this.modules[0]);
    //      this.selectCategory(
    //        this.selectedModule.categories[0]
    //      );
    //    }
  }

  selectModule(module: Module) {
    this.selectedModule = module;
    this.selectFirstVisible();
  }

  // defines which tool category the user have selected
  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  selectFirstVisible() {
    const filteredModules = new ModulePipe(this.pipeService).transform(this.modules, this.searchTool);
    if (filteredModules && !filteredModules.includes(this.selectedModule) && filteredModules[0]) {
      this.selectModule(filteredModules[0]);
    }

    const filteredCategories = new CategoryPipe(this.pipeService).transform(
      this.selectedModule.categories,
      this.searchTool,
    );
    if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
      this.selectCategory(filteredCategories[0]);
    }
  }

  selectTool(tool: Tool) {
    // FIXME after tool selection refactoring
    // const toolSelection: ToolSelection = {
    //   tool: tool,
    //   inputBindings: null,
    //   category: this.selectedCategory,
    //   module: this.selectedModule
    // };
    // this.toolSelectionService.selectToolAndBindInputs(
    //   toolSelection,
    //   this.sessionData
    // );
  }

  search(value: any) {
    this.searchTool = value;
    this.selectFirstVisible();
  }

  searchEnter() {
    // select the first result
    const visibleTools = new ToolPipe(this.pipeService).transform(this.selectedCategory.tools, this.searchTool);
    if (visibleTools[0]) {
      this.searchTool = null;
      // this.selectTool(visibleTools[0].name.id);
      this.selectTool(visibleTools[0]);
    }
  }

  openChange(isOpen) {
    if (isOpen) {
      this.searchBox.focus();
    }
  }
}
