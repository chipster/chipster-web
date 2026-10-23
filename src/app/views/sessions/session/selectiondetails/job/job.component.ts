import { Component, computed, inject, input, linkedSignal, output } from "@angular/core";
import { Job, JobInput, JobParameter, Tool } from "chipster-js-common";
import JobOutput from "chipster-js-common/lib/model/joboutput";
import { capitalize, clone } from "lodash-es";
import log from "loglevel";
import { EMPTY, Observable } from "rxjs";
import { SessionData } from "../../../../../model/session/session-data";
import { JobService } from "../../job.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { ToolService } from "../../tools/tool.service";
import { DatasetParameterListComponent } from "../dataset-parameter-list/dataset-parameter-list.component";
import { LinkButtonComponent } from "../../link-button/link-button.component";
import { AsyncPipe } from "@angular/common";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-job",
  templateUrl: "./job.component.html",
  styleUrls: ["./job.component.less"],
  imports: [DatasetParameterListComponent, LinkButtonComponent, AsyncPipe, BytesPipe, LocalDatePipe],
})
export class JobComponent {
  private selectionHandlerService = inject(SelectionHandlerService);
  private selectionService = inject(SelectionService);
  private sessionDataService = inject(SessionDataService);
  private toolService = inject(ToolService);
  private jobService = inject(JobService);

  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);
  // the jobs modal closes on it
  readonly datasetSelected = output<void>();

  private readonly selectedJobId = computed(() => this.selectionService.selectedJobs?.[0]?.jobId ?? null);

  // the latest copy of the selected job: job events replace it in jobsMap
  readonly job = computed<Job>(() => {
    const jobId = this.selectedJobId();
    return jobId ? (this.sessionDataService.getJobById(jobId, this.sessionData().jobsMap()) ?? null) : null;
  });

  readonly isRunning = computed(() => this.job() != null && JobService.isRunning(this.job()));
  readonly failed = computed(() => this.job() != null && !JobService.isSuccessful(this.job()));
  readonly state = computed(() => (this.job() ? capitalize(this.job().state) : null));
  readonly duration = computed<Observable<string>>(() => (this.job() ? JobService.getDuration(this.job()) : EMPTY));
  readonly applicationVersions = computed<Array<{ application: string; version: string }>>(() =>
    this.job() ? this.jobService.getApplicationVersions(this.job()) : [],
  );
  readonly rSessionInfo = computed(
    () => this.applicationVersions().find((v) => v.application === "R Session Info")?.version ?? null,
  );
  readonly isRTool = computed(() => this.job()?.toolId?.endsWith(".R") ?? false);
  private readonly screenOutput = computed(() => this.job()?.screenOutput ?? null);
  readonly hasInputLines = computed(
    () =>
      this.screenOutput()
        ?.split("\n")
        .some((line) => line.startsWith(">")) ?? false,
  );
  // hide them again when another job is selected
  readonly hideInputLines = linkedSignal(() => {
    this.selectedJobId();
    return true;
  });
  readonly filteredScreenOutput = computed(() => this.filterScreenOutput(this.screenOutput(), this.hideInputLines()));

  readonly tool = computed(() => {
    const job = this.job();
    return job ? this.tools()?.find((t) => t.name.id === job.toolId) : undefined;
  });
  readonly parameterListForView = computed(() => this.getParameters(this.job()?.parameters ?? [], this.tool()));
  readonly inputListForView = computed(() => this.getInputs(this.job()?.inputs ?? [], this.tool()));
  readonly outputListForView = computed(() => this.getOutputs(this.job()));

  parameterLimit = 12;
  rSessionInfoVisible = false;

  toggleInputLines() {
    this.hideInputLines.update((hide) => !hide);
  }

  private filterScreenOutput(screenOutput: string, hideInputLines: boolean): string {
    if (!hideInputLines || !screenOutput) {
      return screenOutput;
    }
    const lines = screenOutput.split("\n");
    let prevWasInput = false; // this for clarity instead of reduce
    return lines
      .filter((line) => {
        const isInput = line.startsWith(">") || (prevWasInput && line.startsWith("+"));
        prevWasInput = isInput;
        return !isInput;
      })
      .join("\n");
  }

  private getOutputs(job: Job): Array<JobOutput> {
    if (job == null) {
      return [];
    }
    if (job.outputs != null) {
      return job.outputs;
    }
    // only jobs since Chipster version 11/2023 define outputs
    log.info("job doesn't define outputs, find from datasets");
    return this.sessionDataService
      .getDatasetList(this.sessionData())
      .filter((d) => d.sourceJob === job.jobId)
      .map((d) => ({
        outputId: null,
        displayName: null,
        datasetId: d.datasetId,
      }));
  }

  close() {
    this.selectionHandlerService.setJobSelection([]);
  }

  cancelJob() {
    this.sessionDataService.cancelJob(this.job());
  }

  selectDataset(datasetId: string) {
    const dataset = this.getDataset(datasetId);
    this.selectionHandlerService.setDatasetSelection([dataset]);
    this.datasetSelected.emit();
  }

  getDataset(datasetId: string) {
    return this.sessionData().datasetsMap().get(datasetId);
  }

  hasDataset(datasetId: string) {
    return this.getDataset(datasetId) != null;
  }

  getDatasetName(datasetId: string) {
    return this.getDataset(datasetId).name;
  }

  private getParameters(parameters: JobParameter[], tool: Tool): Array<JobParameter> {
    const parameterListForView: Array<JobParameter> = [];

    parameters.forEach((jobParameter) => {
      const _clone = clone(jobParameter);

      if (tool) {
        const toolParameter = tool.parameters.find((p) => p.name.id === jobParameter.parameterId);

        if (toolParameter) {
          // get the parameters display name from the tool
          _clone.displayName = toolParameter.name.displayName;

          // if an enum parameter
          if (toolParameter.selectionOptions) {
            // find the value's display name from the tool
            const toolOption = toolParameter.selectionOptions.find((o) => o.id === jobParameter.value);
            if (toolOption) {
              if (toolOption.displayName) {
                _clone.value = toolOption.displayName;
              }
            } else {
              log.warn(
                `job parameter value${jobParameter.value} not found from the current tool ` +
                  `paramater options, showing the id`,
              );
            }
          }
        }
      }
      parameterListForView.push(_clone);
    });

    parameterListForView
      .filter((p) => p.displayName == null)
      .forEach((p) => {
        p.displayName = p.parameterId;
      });

    return parameterListForView;
  }

  private getInputs(inputs: JobInput[], tool: Tool): Array<JobInput> {
    /* The new Chipster has misleadingly saved dataset name in input.displayName at
    least between 2018-2023. Try to find the displayName from the current tool
    instead, otherwise show the plain inputId.
    */
    const inputListForView: Array<JobInput> = [];

    inputs.forEach((jobInput) => {
      const _clone = clone(jobInput);

      // if datasetName is not null, then we can already trust the displayName
      if (jobInput.datasetName == null && tool) {
        // if datasetName is null, we can try to find a displayName from the current tool for old jobs
        const toolInput = tool.inputs.find((i) => i.name.id === jobInput.inputId);

        if (toolInput) {
          // get the input display name from the tool
          _clone.displayName = toolInput.name.displayName;
        }
      }

      inputListForView.push(_clone);
    });

    inputListForView
      .filter((i) => i.displayName == null)
      .forEach((i) => {
        i.displayName = i.inputId;
      });

    return inputListForView;
  }

  toggleRSessionInfo() {
    this.rSessionInfoVisible = !this.rSessionInfoVisible;
  }
}
