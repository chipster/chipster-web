import Tool from "../../../../../model/session/tool";
import Dataset from "../../../../../model/session/dataset";
import {ToolService} from "../tool.service";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import ToolParameter from "../../../../../model/session/toolparameter";
import {SessionDataService} from "../../sessiondata.service";
import {Observable, Subject} from "rxjs/Rx";
import {TSVReader} from "../../../../../shared/services/TSVReader";
import * as _ from "lodash";
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

  constructor(private tsvReader: TSVReader,
              private sessionDataService: SessionDataService,
              private toolSelectionService: ToolSelectionService,
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
    // TODO reset col_sel and metacol_sel if selected dataset has changed
    for (let param of tool.parameters) {
      this.populateParameterValues(param);
    }

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

  // TODO move to service?
  getDatasetHeaders(): Observable<Array<string>>[] {
    return this.selectedDatasets.map((dataset: Dataset) => this.tsvReader.getTSVFileHeaders(this.sessionDataService.getSessionId(), dataset));
  }

  // TODO move to service?
  populateParameterValues(parameter: ToolParameter) {
    if (!parameter.value) {
      parameter.value = this.toolService.getDefaultValue(parameter);
    }

    if (parameter.type === 'COLUMN_SEL') {
      Observable.forkJoin(this.getDatasetHeaders()).subscribe((datasetsHeaders: Array<Array<string>>) => {
        let columns = _.uniq(_.flatten(datasetsHeaders));
        parameter.selectionOptions = columns.map(function (column) {
          return {id: column};
        });

        // reset value to empty if previous or default value is now invalid
        if (parameter.value && !ToolsModalComponent.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
          parameter.value = '';
        }

      });


    }

    // TODO reset value to empty if previous or default value is now invalid
    if (parameter.type === 'METACOLUMN_SEL') {
      parameter.selectionOptions = this.getMetadataColumns().map(function (column) {
        return {id: column};
      });
    }
  }

  // TODO move to service
  getMetadataColumns() {

    let keySet = new Set();
    for (let dataset of this.selectedDatasets) {
      for (let entry of dataset.metadata) {
        keySet.add(entry.key);
      }
    }
    return Array.from(keySet);
  }

  static selectionOptionsContains(options: any[], value: string | number) {
    for (let option of options) {
      if (value === option.id) {
        return true;
      }
    }
    return false;
  }

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

}
