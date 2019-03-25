import { Injectable } from "@angular/core";
import { Job, Dataset } from "chipster-js-common";
import { ToolService } from "./tools/tool.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionDataService } from "./session-data.service";
import { ValidatedTool } from "./tools/ToolSelection";
import log from "loglevel";
import { GetSessionDataService } from "./get-session-data.service";
import { DatasetService } from "./dataset.service";

@Injectable()
export class JobService {
  constructor(
    private sessionDataService: SessionDataService,
    private toolService: ToolService,
    private restErrorService: RestErrorService,
    private datasetService: DatasetService
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

  runForEach(validatedTool: ValidatedTool) {
    // sanity check
    if (!validatedTool.runForEachValid) {
      log.warn("requesting run for each, but run for each validation not ok");
      return;
    }

    // for each selected dataset, clone validatedTool and replace
    // bindings with a single binding containing the selected dataset
    const jobs: Job[] = validatedTool.selectedDatasets
      .map((dataset: Dataset) => {
        return Object.assign({}, validatedTool, {
          inputBindings: [
            {
              toolInput: validatedTool.tool.inputs[0],
              datasets: [dataset]
            }
          ]
        });
      })
      .map((clonedTool: ValidatedTool) => {
        return this.createJob(clonedTool);
      });

    // submit
    this.sessionDataService.createJobs(jobs).subscribe(null, (error: any) => {
      this.restErrorService.showError("Submitting jobs failed", error);
    });
  }

  // Method for submitting a job
  runJob(validatedTool: ValidatedTool) {
    // create
    const job = this.createJob(validatedTool);

    // submit
    this.sessionDataService.createJob(job).subscribe(null, (error: any) => {
      this.restErrorService.showError("Submitting job failed", error);
    });
  }

  private createJob(validatedTool: ValidatedTool): Job {
    // create job
    const job: Job = <Job>{
      toolId: validatedTool.tool.name.id,
      toolCategory: validatedTool.category.name,
      module: validatedTool.module.moduleId,
      toolName: validatedTool.tool.name.displayName,
      toolDescription: validatedTool.tool.description,
      state: "NEW"
    };

    // set parameters
    job.parameters = [];
    for (const toolParam of validatedTool.tool.parameters) {
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

    // add bound inputs
    for (const inputBinding of validatedTool.inputBindings.filter(
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

    // phenodata
    job.metadataFiles = validatedTool.phenodataBindings
      .filter(binding => binding.dataset != null)
      .map(binding => {
        return {
          name: binding.toolInput.name.id,
          content: this.datasetService.getOwnPhenodata(binding.dataset)
        };
      });

    return job;
  }
}
