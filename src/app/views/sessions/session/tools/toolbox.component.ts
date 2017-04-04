import {SessionDataService} from "../sessiondata.service";
import {ToolService} from "./tool.service";
import Module from "../../../../model/session/module";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Tool from "../../../../model/session/tool";
import {SelectionService} from "../selection.service";
import * as _ from "lodash";
import {Component, Input} from "@angular/core";
import {ToolSelection} from "./ToolSelection";
import {Store} from "@ngrx/store";
import {Subject} from "rxjs";
import {SET_TOOL_SELECTION} from "../../../../state/selected-tool.reducer";


@Component({
  selector: 'ch-toolbox',
  templateUrl: './tools.html'
})
export class ToolBoxComponent {

  @Input() modules: Array<Module>;
  @Input() tools: Array<Tool>;

  constructor(private SessionDataService: SessionDataService,
              private SelectionService: SelectionService,
              private toolService: ToolService,
              private store: Store<any>) {
  }

  toolSelection$ = new Subject();

  //initialization
  toolSelection: ToolSelection = null;
  selectedDatasets: Dataset[] = [];

  ngOnInit() {
    this.modules = _.cloneDeep(this.modules);
    this.selectedDatasets = this.SelectionService.selectedDatasets;

    this.toolSelection$.map((toolSelection: ToolSelection) => ({type: SET_TOOL_SELECTION, payload: toolSelection})).subscribe(this.store.dispatch.bind(this.store));

    this.store.select('toolSelection').subscribe(
      (toolSelection: ToolSelection) => {this.toolSelection = toolSelection},
      (error: any) => {console.error('Fetching tool from store failed', error)}
    );

    // fetch selectedDatasets from store and if tool is selected update it's inputbindings and update store
    this.store.select('selectedDatasets').subscribe(
      (selectedDatasets: Array<Dataset>) => {
        this.selectedDatasets = selectedDatasets;
        if(this.toolSelection) {
          const updatedInputBindings = this.toolService.bindInputs(this.toolSelection.tool, this.SelectionService.selectedDatasets);
          const newToolSelection = Object.assign({}, this.toolSelection, {inputBindings: updatedInputBindings});
          this.toolSelection$.next(newToolSelection);
        }
      },
      (error: any) => {console.error('Fetching selected datasets from store failed', error)}
    );
  }

  isRunEnabled() {
    // TODO add mandatory parameters check
    // tool selected and either bindings ok or tool without inputs
    return this.toolSelection && (this.toolService.checkBindings(this.toolSelection.inputBindings) ||
      (!this.toolSelection.tool.inputs || this.toolSelection.tool.inputs.length === 0));
  }

  // Method for submitting a job
  runJob() {

    // create job
    let job: Job = <Job>{
      toolId: this.toolSelection.tool.name.id,
      toolCategory: this.toolSelection.category.name,
      toolName: this.toolSelection.tool.name.displayName,
      toolDescription: this.toolSelection.tool.description,
      state: 'NEW',
    };

    // set parameters
    job.parameters = [];
    for (let toolParam of this.toolSelection.tool.parameters) {
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
    if (!this.toolSelection.inputBindings) {
      console.error('NO INPUT BINDINGS ON SELECT TOOL - THIS SHOULDNT BE SHOWN');
      console.warn("no input bindings before running a job, binding now");
      // this.inputBindings = this.toolService.bindInputs(this.toolSelection.tool, this.SelectionService.selectedDatasets);
    }

    // TODO report to user
    if (!this.toolService.checkBindings(this.toolSelection.inputBindings)) {
      console.error("refusing to run a job due to invalid bindings");
      return;
    }

    // add bound inputs
    for (let inputBinding of this.toolSelection.inputBindings.filter(binding => binding.datasets.length > 0)) {

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
