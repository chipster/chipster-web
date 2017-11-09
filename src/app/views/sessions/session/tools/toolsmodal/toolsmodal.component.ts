import Tool from "../../../../../model/session/tool";
import Dataset from "../../../../../model/session/dataset";
import {ToolService} from "../tool.service";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import {Subject} from "rxjs/Rx";
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from "@angular/core";
import {ModulePipe} from "../../../../../shared/pipes/modulepipe.pipe";
import {PipeService} from "../../../../../shared/services/pipeservice.service";
import {CategoryPipe} from "../../../../../shared/pipes/categorypipe.pipe";
import {ToolPipe} from "../../../../../shared/pipes/toolpipe.pipe";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ToolSelection} from "../ToolSelection";
import {Store} from "@ngrx/store";
import {SET_TOOL_SELECTION} from "../../../../../state/selected-tool.reducer";
import InputBinding from "../../../../../model/session/inputbinding";
import {SessionData} from "../../../../../model/session/session-data";
import {ToolSelectionService} from "../../tool.selection.service";

@Component({
  selector: 'ch-tools-modal',
  templateUrl: './toolsmodal.html',
  styleUrls: ['./toolsmodal.less']
})
export class ToolsModalComponent {

  private searchTool: string;
  private inputDescription: string;

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  selectTool$ = new Subject();

  @Input() sessionData: SessionData;
  @Input() selectedDatasets: Array<Dataset> = [];
  @Input() toolSelection: ToolSelection;
  @Output() onRunJob: EventEmitter<any> = new EventEmitter();

  modules: Array<Module> = [];
  tools: Array<Tool> = [];

  @ViewChild('toolsModalTemplate') toolsModalTemplate: ElementRef;
  toolsModalRef: NgbModalRef;

  constructor(private toolSelectionService: ToolSelectionService,
              private pipeService: PipeService,
              private toolService: ToolService,
              private ngbModal: NgbModal,
              private store: Store<any>) {
  }

  ngOnInit() {

    this.modules = this.sessionData.modules;
    this.tools = this.sessionData.tools;

    this.selectTool$.map((toolSelection: ToolSelection) => ({type: SET_TOOL_SELECTION, payload: toolSelection}))
      .subscribe(this.store.dispatch.bind(this.store));

    // trigger parameter validation
    if (this.toolSelection) {
      // make sure the module and category are selected even after changing the session
      this.selectModule(this.toolSelection.module);
      this.selectCategory(this.toolSelection.category);
      this.selectTool(this.toolSelection.tool);
    } else {
      this.selectModule(this.modules[0]);
      this.selectCategory(this.selectedModule.categories[0]);
    }

  }

  selectModule(module: Module) {
    this.selectedModule = module;
    this.selectFirstVisible();
  }

  //defines which tool category the user have selected
  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  selectFirstVisible() {
    let filteredModules = new ModulePipe(this.pipeService).transform(this.modules, this.searchTool);
    if (filteredModules && filteredModules.indexOf(this.selectedModule) < 0 && filteredModules[0]) {
      this.selectModule(filteredModules[0]);
    }

    let filteredCategories = new CategoryPipe(this.pipeService).transform(this.selectedModule.categories, this.searchTool);
    if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
      this.selectCategory(filteredCategories[0]);
    }
  }


  selectTool(tool: Tool) {
    // // TODO reset col_sel and metacol_sel if selected dataset has changed
    // for (let param of tool.parameters) {
    //   this.populateParameterValues(param);
    // }

    const toolSelection: ToolSelection = {
      tool: tool,
      inputBindings: this.toolService.bindInputs(this.sessionData, tool, this.selectedDatasets),
      category: this.selectedCategory,
      module: this.selectedModule
    };

    this.selectTool$.next(toolSelection);
  }


  toolSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select the first result
      let visibleTools = new ToolPipe(this.pipeService).transform(this.selectedCategory.tools, this.searchTool);
      if (visibleTools[0]) {
        this.searchTool = null;
        // this.selectTool(visibleTools[0].name.id);
        this.selectTool(visibleTools[0]);
      }
    }
    if (e.keyCode == 27) { // escape key
      // clear the search
      this.searchTool = null;
    }
  }

  setInputDescription(description: string) {
    this.inputDescription = description;
  }

  runJob() {
    this.onRunJob.emit();
    this.toolsModalRef.close();
  };

  close() {
    this.toolsModalRef.close();
  };


  openToolsModal() {
    this.toolsModalRef = this.ngbModal.open(this.toolsModalTemplate, {size: 'lg'});
  }

  updateBindings(updatedBindings: InputBinding[]) {
    const toolSelection: ToolSelection = {
      tool: this.toolSelection.tool,
      inputBindings: updatedBindings,
      category: this.selectedCategory,
      module: this.selectedModule
    };

    this.selectTool$.next(toolSelection);


  }

  getManualPage() {
    let tool: string = this.toolSelection.tool.name.id;

    if (tool.endsWith('.java')) {
      // remove the java package name
      let splitted = tool.split('.');
      if (splitted.length > 2) {
        // java class name
        return splitted[splitted.length - 2] + '.html';
      }
    } else {
      for (let ext of ['.R', '.py']) {
        if (tool.endsWith(ext)) {
          return tool.slice(0, -1 * ext.length) + '.html';
        }
      }
    }
    return tool;
  }
}
