import { Injectable } from "@angular/core";
import { Job } from "chipster-js-common";
import log from "loglevel";
import { interval, Observable, of } from "rxjs";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../model/session/session-data";
import UtilsService from "../../../shared/utilities/utils";
import { DatasetService } from "./dataset.service";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { SessionDataService } from "./session-data.service";
import { ToolSelectionService } from "./tool.selection.service";
import { ToolService } from "./tools/tool.service";
import { ValidatedTool } from "./tools/ToolSelection";

@Injectable()
export class JobService {
  constructor(
    private sessionDataService: SessionDataService,
    private toolService: ToolService,
    private restErrorService: RestErrorService,
    private datasetService: DatasetService,
    private toolSelectionService: ToolSelectionService,
    private dialogModalService: DialogModalService
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
            // happens if your own computer time is lagging behind
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

  runForEach(validatedTool: ValidatedTool, sessionData: SessionData) {
    // sanity check
    if (!validatedTool.runForEachValid) {
      log.warn("requesting run for each, but run for each validation not ok");
      return;
    }

    // for each file, create new ValidatedTool
    const reboundValidatedTools = validatedTool.selectedDatasets.map(
      (dataset) =>
        this.toolSelectionService.rebindWithNewDatasetsAndValidate(
          [dataset],
          validatedTool,
          sessionData
        )
    );

    // // debug print
    // reboundValidatedTools.forEach((sampleValidatedTool) => {
    //   console.log("SAMPLE VALIDATED TOOL", sampleValidatedTool);
    //   console.log("sample valid: ", sampleValidatedTool.valid);
    //   sampleValidatedTool.inputBindings.forEach((inputBinding) => {
    //     console.log(
    //       inputBinding.toolInput.name.id +
    //         " -> " +
    //         inputBinding.datasets[0]?.name
    //     );
    //   });
    // });

    // TODO check that all validatedTools are valid
    const invalidValidatedToolsForSamples = reboundValidatedTools.filter(
      (sampleValidatedTool) => sampleValidatedTool.valid === false
    );
    if (invalidValidatedToolsForSamples.length > 0) {
      // FIXME add details
      const message = "";

      this.dialogModalService.openNotificationModal(
        "Run for each sample not possible",
        message
      );
      return;
    }

    // create jobs from ValidatedTools
    const jobs: Job[] = reboundValidatedTools.map(
      (sampleValidatedTool: ValidatedTool) => {
        return this.createJob(sampleValidatedTool);
      }
    );

    // submit
    this.sessionDataService.createJobs(jobs).subscribe({
      error: (error: any) => {
        this.restErrorService.showError("Submitting jobs failed", error);
      },
    });
  }

  runForEachSample(validatedTool: ValidatedTool, sessionData) {
    // sanity check
    if (!validatedTool.runForEachSampleValid) {
      log.warn(
        "requesting run for each sample , but run for each validation not ok"
      );
      return;
    }

    const validatedToolsForSamples = this.toolSelectionService.getValidatedToolForEachSample(
      validatedTool,
      sessionData
    );

    // check that all rebound validatedTools are valid
    const invalidValidatedToolsForSamples = validatedToolsForSamples.filter(
      (sampleValidatedTool) => sampleValidatedTool.valid === false
    );
    if (invalidValidatedToolsForSamples.length > 0) {
      // FIXME add details
      const message = "";

      this.dialogModalService.openNotificationModal(
        "Run for each sample not possible",
        message
      );
      return;
    }

    // create jobs from ValidatedTools
    const jobs: Job[] = validatedToolsForSamples.map(
      (sampleValidatedTool: ValidatedTool) => {
        return this.createJob(sampleValidatedTool);
      }
    );

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
