import {SessionDataService} from "../sessiondata.service";
import {ToolService} from "./tool.service";
import Category from "../../../../model/session/category";
import Module from "../../../../model/session/module";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Tool from "../../../../model/session/tool";
import InputBinding from "../../../../model/session/inputbinding";
import {SelectionService} from "../selection.service";
import Utils from "../../../../shared/utilities/utils";
import * as _ from "lodash";
import {Component, Input} from "@angular/core";
import {ToolSelection} from "./ToolSelection";


@Component({
  selector: 'ch-toolbox',
  templateUrl: './tools.html'
})
export class ToolBoxComponent {

  @Input() modules: Array<Module>;
  @Input() tools: Array<Tool>;

  constructor(private SessionDataService: SessionDataService,
              private SelectionService: SelectionService,
              private toolService: ToolService) {
  }

  //initialization
  selectedModule: Module = null;
  selectedCategory: Category = null;
  selectedTool: Tool = null;
  selectedDatasets: Dataset[] = [];
  inputBindings: InputBinding[] = null;

  ngOnInit() {
    this.modules = _.cloneDeep(this.modules);
    this.selectedDatasets = this.SelectionService.selectedDatasets;

    // TODO do bindings for tools with no inputs?
  }


  // watch for data selection changes
  ngDoCheck() {
    if (this.selectedDatasets && (this.selectedDatasets.length !== this.SelectionService.selectedDatasets.length || !Utils.equalStringArrays(Utils.getDatasetIds(this.selectedDatasets), Utils.getDatasetIds(this.SelectionService.selectedDatasets)))) {

      // save for comparison
      this.selectedDatasets = _.cloneDeep(this.SelectionService.selectedDatasets);

      // bind if tool selected
      if (this.selectedTool) {
        console.info("dataset selection changed -> binding inputs");
        this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
      }
    }
  }

  isRunEnabled() {
    // TODO add mandatory parameters check
    // either bindings ok or tool without inputs
    return this.inputBindings ||
      (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
  }

  setToolSelection(input: ToolSelection): void {
    this.selectedTool = input.tool;
    this.inputBindings = input.inputBindings;
    this.selectedCategory = input.category;
    this.selectedModule = input.module;
  }

  // Method for submitting a job
  runJob() {

    // create job
    let job: Job = <Job>{
      toolId: this.selectedTool.name.id,
      toolCategory: this.selectedCategory.name,
      toolName: this.selectedTool.name.displayName,
      toolDescription: this.selectedTool.description,
      state: 'NEW',
    };

    // set parameters
    job.parameters = [];
    for (let toolParam of this.selectedTool.parameters) {
      job.parameters.push({
        parameterId: toolParam.name.id,
        displayName: toolParam.name.displayName,
        description: toolParam.description,
        type: toolParam.type,
        value: toolParam.value
        // access selectionOptions, defaultValue, optional, from and to values from the toolParameter
      });
    }

    // set inputs
    job.inputs = [];
    // TODO bindings done already?
    if (!this.inputBindings) {
      console.warn("no input bindings before running a job, binding now");
      this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
    }

    for (let inputBinding of this.inputBindings) {

      // single input
      if (!this.toolService.isMultiInput(inputBinding.toolInput)) {
        job.inputs.push({
          inputId: inputBinding.toolInput.name.id,
          description: inputBinding.toolInput.description,
          datasetId: inputBinding.datasets[0].datasetId,
          displayName: inputBinding.datasets[0].name
        });
      }

      // multi input
      else {
        let i = 0;
        for (let dataset of inputBinding.datasets) {
          job.inputs.push({
            inputId: this.toolService.getMultiInputId(inputBinding.toolInput, i),
            description: inputBinding.toolInput.description,
            datasetId: dataset.datasetId,
            displayName: dataset.name
          });
          i++;
        }
      }
    }

    // runsys
    this.SessionDataService.createJob(job).subscribe((result: any) => {
    }, (error: any) => {
      console.error('Failed running job', error);
    });
  }

}
