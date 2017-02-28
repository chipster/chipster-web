import Tool from "../../../../../model/session/tool";
import InputBinding from "../../../../../model/session/inputbinding";
import Dataset from "../../../../../model/session/dataset";
import {ToolService} from "../tool.service";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import ToolParameter from "../../../../../model/session/toolparameter";
import SessionDataService from "../../sessiondata.service";
import {Observable} from "rxjs/Rx";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {TSVReader} from "../../../../../shared/services/TSVReader";
import * as _ from "lodash";
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from "@angular/core";
import {ModulePipe} from "../../../../../shared/pipes/modulepipe.pipe";
import {PipeService} from "../../../../../shared/services/pipeservice.service";
import {CategoryPipe} from "../../../../../shared/pipes/categorypipe.pipe";
import {ToolPipe} from "../../../../../shared/pipes/toolpipe.pipe";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ToolSelection} from "../ToolSelection";

@Component({
  selector: 'ch-tools-modal',
  templateUrl: './toolsmodal.html',
  styleUrls: ['./toolsmodal.less']
})
export class ToolsModalComponent {

  private searchTool: string;
  private inputDescription: string;
  @Input() modules: Array<Module> = [];
  @Input() tools: Array<Tool> = [];
  @Input() inputBindings: Array<InputBinding> = [];
  @Input() selectedDatasets: Array<Dataset> = [];
  @Input() selectedModule:   Module;
  @Input() selectedCategory: Category;
  @Input() selectedTool: Tool;

  @Output() onRunJob: EventEmitter<any> = new EventEmitter();
  @Output() onSelectTool: EventEmitter<ToolSelection> = new EventEmitter();

  @ViewChild('toolsModalTemplate') toolsModalTemplate: ElementRef;
  toolsModalRef: NgbModalRef;


  constructor(private toolService: ToolService,
              private tsvReader: TSVReader,
              private sessionDataService: SessionDataService,
              private pipeService: PipeService,
              private ngbModal: NgbModal) {}

  ngOnInit() {

    // trigger parameter validation
    if (this.selectedTool) {
      this.selectTool(this.selectedTool);
    }

    if (!this.selectedModule) {
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

    this.selectedTool = tool;

    // TODO reset col_sel and metacol_sel if selected dataset has changed
    for (let param of tool.parameters) {
      this.populateParameterValues(param);
    }

    this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.selectedDatasets);

    this.onSelectTool.emit(this.getToolSelection());
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


  isRunEnabled() {
    // TODO add mandatory parameters check

    // either bindings ok or tool without inputs
    return this.inputBindings ||
      (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
  }


  setInputDescription(description: string) {
    this.inputDescription = description;
  }

  runJob() {
    this.onRunJob.emit();
    this.toolsModalRef.close();
  };

  getToolSelection(): ToolSelection {
    return {
      tool: this.selectedTool,
      inputBindings: this.inputBindings,
      category: this.selectedCategory,
      module: this.selectedModule
    }
  }

  close() {
    this.toolsModalRef.close();
  };


  openInputsModal() {
    // let modalInstance = this.$uibModal.open({
    //   animation: true,
    //   templateUrl: '../inputsmodal/inputsmodal.html',
    //   controller: 'InputsModalController',
    //   controllerAs: 'vm',
    //   bindToController: true,
    //   size: 'lg',
    //   resolve: {
    //
    //     selectedTool: () => {
    //       return _.cloneDeep(this.selectedTool);
    //     },
    //     moduleName: () => {
    //       return this.selectedModule.name;
    //     },
    //     categoryName: () => {
    //       return this.selectedCategory.name;
    //     },
    //     inputBindings: () => {
    //       return this.inputBindings;
    //     },
    //     selectedDatasets: () => {
    //       return _.cloneDeep(this.selectedDatasets);
    //     }
    //   }
    // });

    // modalInstance.result.then((result: any) => {
    //   this.inputBindings = result.inputBindings;
    //
    // }, function () {
    //   modal dismissed
    // });

  }

  // TODO move to service?
  getDatasetHeaders(): Observable<TSVFile>[] {
    return this.selectedDatasets.map((dataset: Dataset) => this.tsvReader.getTSVFile(this.sessionDataService.getSessionId(), dataset.datasetId));
  }

  // TODO move to service?
  populateParameterValues(parameter: ToolParameter) {
    if (!parameter.value) {
      parameter.value = this.toolService.getDefaultValue(parameter);
    }

    if (parameter.type === 'COLUMN_SEL') {
      Observable.forkJoin(this.getDatasetHeaders()).subscribe((tsvFiles: Array<TSVFile>) => {
        let columns = _.uniq(_.flatten(tsvFiles.map((tsvFile: TSVFile) => tsvFile.headers.headers)));
        parameter.selectionOptions = columns.map(function (column) {
          return {id: column};
        });

        // reset value to empty if previous or default value is now invalid
        if (parameter.value && !this.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
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

    var keySet = new Set();
    for (let dataset of this.selectedDatasets) {
      for (let entry of dataset.metadata) {
        keySet.add(entry.key);
      }
    }
    return Array.from(keySet);
  }

  selectionOptionsContains(options: any[], value: string | number) {
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

}
