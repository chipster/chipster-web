import {SessionDataService} from "../sessiondata.service";
import {ToolService} from "./tool.service";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import {SelectionService} from "../selection.service";
import {Component, Input, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {ToolSelection} from "./ToolSelection";
import {Store} from "@ngrx/store";
import {Subject} from "rxjs";
import {SET_TOOL_SELECTION} from "../../../../state/selected-tool.reducer";
import {SessionData} from "../../../../model/session/session-data";
import {ToolSelectionService} from "../tool.selection.service";
import {NgbDropdown, NgbDropdownConfig} from "@ng-bootstrap/ng-bootstrap";
import {RestErrorService} from "../../../../core/errorhandler/rest-error.service";


@Component({
  selector: 'ch-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.less'],
  providers: [NgbDropdownConfig]
})
export class ToolsComponent implements OnInit, OnDestroy {

  @Input() sessionData: SessionData;

  @ViewChild('toolsDropdown') public toolsDropdown: NgbDropdown;

  //initialization
  toolSelection: ToolSelection = null;

  toolSelection$ = new Subject();

  selectedDatasets: Dataset[] = [];

  subscriptions: Array<any> = [];

  constructor(
    private SessionDataService: SessionDataService,
    private SelectionService: SelectionService,
    public toolSelectionService: ToolSelectionService,
    private toolService: ToolService,
    private store: Store<any>,
    private restErrorService: RestErrorService,
    dropdownConfig: NgbDropdownConfig) {

    // close only on outside click
    dropdownConfig.autoClose = 'outside';
  }

  ngOnInit() {

    this.selectedDatasets = this.SelectionService.selectedDatasets;

    this.toolSelection$.map((toolSelection: ToolSelection) => ({type: SET_TOOL_SELECTION, payload: toolSelection})).subscribe(this.store.dispatch.bind(this.store));

    this.subscriptions.push(this.store.select('toolSelection').subscribe(
      (toolSelection: ToolSelection) => {this.toolSelection = toolSelection},
      (error: any) => {console.error('Fetching tool from store failed', error)}
    ));

    // fetch selectedDatasets from store and if tool is selected update it's inputbindings and update store
    this.subscriptions.push(this.store.select('selectedDatasets').subscribe(
      (selectedDatasets: Array<Dataset>) => {
        this.selectedDatasets = selectedDatasets;
        if(this.toolSelection) {
          const updatedInputBindings = this.toolService.bindInputs(this.sessionData, this.toolSelection.tool, this.SelectionService.selectedDatasets);
          const newToolSelection = Object.assign({}, this.toolSelection, {inputBindings: updatedInputBindings});
          this.toolSelection$.next(newToolSelection);
        }
      },
      (error: any) => {console.error('Fetching selected datasets from store failed', error)}
    ));

    // trigger parameter validation
    if (this.toolSelection) {
      this.selectTool(this.toolSelection);
    }
  }

  // ngOnInit() {
  //
  //   this.modules = this.sessionData.modules;
  //   this.tools = this.sessionData.tools;
  //
  //   this.selectTool$.map((toolSelection: ToolSelection) => ({type: SET_TOOL_SELECTION, payload: toolSelection}))
  //     .subscribe(this.store.dispatch.bind(this.store));
  //

  // }


  selectTool(toolSelection: ToolSelection) {

    console.log('selectTool', toolSelection);

    // // TODO reset col_sel and metacol_sel if selected dataset has changed
    // for (let param of tool.parameters) {
    //   this.populateParameterValues(param);
    // }

    // this component knows the selected datasets, so we can create input bindings
    toolSelection.inputBindings = this.toolService.bindInputs(
      this.sessionData, toolSelection.tool, this.selectedDatasets);

    this.toolSelection$.next(toolSelection);

    this.toolsDropdown.close();

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

  ngOnDestroy() {
    this.subscriptions.forEach((subs) => subs.unsubscribe());
    this.subscriptions = [];
  }

  // Method for submitting a job
  runJob() {

    // create job
    let job: Job = <Job>{
      toolId: this.toolSelection.tool.name.id,
      toolCategory: this.toolSelection.category.name,
      module: this.toolSelection.module.moduleId,
      toolName: this.toolSelection.tool.name.displayName,
      toolDescription: this.toolSelection.tool.description,
      state: 'NEW',
    };

    // set parameters
    job.parameters = [];
    for (let toolParam of this.toolSelection.tool.parameters) {

      let value = toolParam.value;
      // the old client converts null values to empty strings, so let's keep the old behaviour for now
      if (value == null) {
        value = '';
      }

      job.parameters.push({
        parameterId: toolParam.name.id,
        displayName: toolParam.name.displayName,
        description: toolParam.description,
        type: toolParam.type,
        value: value
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
    this.SessionDataService.createJob(job).subscribe(null, (error: any) => {
      this.restErrorService.handleError(error, 'Running a job failed');
    });
  }
}
