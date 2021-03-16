import { Injectable } from "@angular/core";
import { Dataset, Job } from "chipster-js-common";
import log from "loglevel";
import { interval, Observable, of } from "rxjs";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import UtilsService from "../../../shared/utilities/utils";
import { DatasetService } from "./dataset.service";
import { SessionDataService } from "./session-data.service";
import { ToolService } from "./tools/tool.service";
import { ValidatedTool } from "./tools/ToolSelection";

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

  static getDuration(job: Job): Observable<string> {
    if (job.startTime == null) {
      return of(null);
    }

    const startDate = UtilsService.parseISOStringToDate(job.startTime);
    const endDate = UtilsService.parseISOStringToDate(job.endTime);

    if (!this.isRunning(job)) {
      if (job.endTime == null) {
        return of(null);
      }
      const duration = UtilsService.millisecondsBetweenDates(
        startDate,
        endDate
      );
      return of(UtilsService.millisecondsToHumanFriendly(duration));
    } else {
      return interval(1000).pipe(
        startWith(0),
        map(() => {
          let now = new Date();
          if (now.getTime() < startDate.getTime()) {
            log.warn(
              "now was " +
                (startDate.getTime() - now.getTime()) +
                " ms earlier than start time"
            );
            now = startDate;
          }
          const millis = UtilsService.millisecondsBetweenDates(startDate, now);
          return UtilsService.millisecondsToHumanFriendly(millis, "now", "now");
        }, distinctUntilChanged())
      );
    }
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
              datasets: [dataset],
            },
          ],
        });
      })
      .map((clonedTool: ValidatedTool) => {
        return this.createJob(clonedTool);
      });

    // submit
    this.sessionDataService.createJobs(jobs).subscribe({
      error: (error: any) => {
        this.restErrorService.showError("Submitting jobs failed", error);
      },
    });
  }

  // Method for submitting a job
  runJob(validatedTool: ValidatedTool) {
    // create
    const job = this.createJob(validatedTool);

    // submit
    this.runJobDirect(job);
  }

  runJobDirect(job: Job) {
    this.sessionDataService.createJob(job).subscribe({
      error: (error: any) => {
        this.restErrorService.showError("Submitting job failed", error);
      },
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
      state: "NEW",
    };

    // set parameters
    job.parameters = [];
    for (const toolParam of validatedTool.tool.parameters) {
      let value = toolParam.value;
      // the old client converts null values to empty strings, so let's keep the old behaviour for now
      // also, to keep old behaviour replace null with EMPTY or empty if selection or string parameter
      // has EMTPY or empty as default
      if (value == null) {
        if (
          toolParam.defaultValue &&
          toolParam.defaultValue.toLowerCase() === "empty" &&
          (this.toolService.isColumnSelectionParameter(toolParam) ||
            this.toolService.isStringParameter(toolParam))
        ) {
          value = toolParam.defaultValue;
        } else {
          value = "";
        }
      }
      job.parameters.push({
        parameterId: toolParam.name.id,
        displayName: toolParam.name.displayName,
        description: toolParam.description,
        type: toolParam.type,
        value: value,
        // access selectionOptions, defaultValue, optional, from and to values from the toolParameter
      });
    }

    // set inputs
    job.inputs = [];

    // add bound inputs
    for (const inputBinding of validatedTool.inputBindings.filter(
      (binding) => binding.datasets.length > 0
    )) {
      // single input
      if (!this.toolService.isMultiInput(inputBinding.toolInput)) {
        job.inputs.push({
          inputId: inputBinding.toolInput.name.id,
          description: inputBinding.toolInput.description,
          datasetId: inputBinding.datasets[0].datasetId,
          displayName: inputBinding.datasets[0].name,
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
            displayName: dataset.name,
          });
          i++;
        }
      }
    }

    // phenodata
    job.metadataFiles = validatedTool.phenodataBindings
      .filter((binding) => binding.dataset != null)
      .map((binding) => {
        return {
          name: binding.toolInput.name.id,
          content: this.datasetService.getOwnPhenodata(binding.dataset),
        };
      });

    return job;
  }
}
