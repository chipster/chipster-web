import { Injectable } from "@angular/core";
import { Job } from "chipster-js-common";
import { ToolService } from "./tools/tool.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { ToolSelection } from "./tools/ToolSelection";
import { SessionDataService } from "./session-data.service";

@Injectable()
export class JobService {
  constructor(
    private sessionDataService: SessionDataService,
    private toolService: ToolService,
    private restErrorService: RestErrorService
  ) {}

  static isRunning(job: Job): boolean {
    return (
      job.state === "NEW" || job.state === "WAITING" || job.state === "RUNNING"
    );
  }

  static isSuccessful(job: Job): boolean {
    return !(
      job.state === "FAILED" ||
      job.state === "FAILED_USER_ERROR" ||
      job.state === "ERROR"
    );
  }

  // Method for submitting a job
  runJob(toolSelection: ToolSelection) {
    // create job
    const job: Job = <Job>{
      toolId: toolSelection.tool.name.id,
      toolCategory: toolSelection.category.name,
      module: toolSelection.module.moduleId,
      toolName: toolSelection.tool.name.displayName,
      toolDescription: toolSelection.tool.description,
      state: "NEW"
    };

    // set parameters
    job.parameters = [];
    for (const toolParam of toolSelection.tool.parameters) {
      let value = toolParam.value;
      // the old client converts null values to empty strings, so let's keep the old behaviour for now
      if (value == null) {
        value = "";
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
    if (!toolSelection.inputBindings) {
      console.error(
        "NO INPUT BINDINGS ON SELECT TOOL - THIS SHOULDNT BE SHOWN"
      );
      console.warn("no input bindings before running a job, binding now");
      // this.inputBindings = this.toolService.bindInputs(toolSelection.tool, this.SelectionService.selectedDatasets);
    }

    // TODO report to user
    if (!this.toolService.checkBindings(toolSelection.inputBindings)) {
      console.error("refusing to run a job due to invalid bindings");
      return;
    }

    // add bound inputs
    for (const inputBinding of toolSelection.inputBindings.filter(
      binding => binding.datasets.length > 0
    )) {
      // single input
      if (!this.toolService.isMultiInput(inputBinding.toolInput)) {
        job.inputs.push({
          inputId: inputBinding.toolInput.name.id,
          description: inputBinding.toolInput.description,
          datasetId: inputBinding.datasets[0].datasetId,
          displayName: inputBinding.datasets[0].name
        });
      } else {
        // multi input
        let i = 0;
        for (const dataset of inputBinding.datasets) {
          job.inputs.push({
            inputId: this.toolService.getMultiInputId(
              inputBinding.toolInput,
              i
            ),
            description: inputBinding.toolInput.description,
            datasetId: dataset.datasetId,
            displayName: dataset.name
          });
          i++;
        }
      }
    }

    // runsys
    this.sessionDataService.createJob(job).subscribe(null, (error: any) => {
      this.restErrorService.handleError(error, "Running a job failed");
    });
  }
}
