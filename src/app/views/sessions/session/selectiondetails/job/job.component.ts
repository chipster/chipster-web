import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, JobParameter, SessionEvent, Tool } from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { Observable, Subject, empty } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { JobService } from "../../job.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { ToolService } from "../../tools/tool.service";

@Component({
  selector: "ch-job",
  templateUrl: "./job.component.html",
  styleUrls: ["./job.component.less"],
})
export class JobComponent implements OnInit, OnDestroy {
  @Input() sessionData: SessionData;
  @Input() tools: Tool[];

  job: Job;
  isRunning: boolean;
  failed: boolean;
  state: string;
  screenOutput: string;
  duration: Observable<string> = empty();
  tool: Tool;
  parameterLimit = 12;
  rSessionInfoVisible = false;

  private unsubscribe: Subject<any> = new Subject();
  // noinspection JSMismatchedCollectionQueryUpdate
  parameterListForView: Array<JobParameter> = [];
  containerMemoryLimit = null;
  isDefaultValueMap: Map<JobParameter, boolean> = new Map();
  outputDatasets: Dataset[];

  constructor(
    public activeModal: NgbActiveModal,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
    private toolService: ToolService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    // job selection events, get's current selection upon subscription
    this.selectionService.selectedJobs$.pipe(takeUntil(this.unsubscribe)).subscribe(
      (selectedJobs: Array<Job>) => {
        this.isDefaultValueMap.clear();
        this.parameterListForView = [];
        let jobId = null;

        if (selectedJobs && selectedJobs.length > 0) {
          jobId = selectedJobs[0].jobId;
          const job = this.sessionDataService.getJobById(jobId, this.sessionData.jobsMap);

          if (job) {
            this.tool = this.tools.find((t) => t.name.id === job.toolId);
            if (this.tool) {
              this.showWithTool(job.parameters, this.tool);
            } else {
              log.warn(`no tool found with ID${job.toolId}`);
            }
          } else {
            log.warn("source job is null");
          }
        }
        this.update(jobId);
      },
      (err) => this.errorService.showError("updating selected jobs failed", err)
    );

    // job modification events
    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (sessionEvent: SessionEvent) => {
          if (this.job && sessionEvent.event.resourceId === this.job.jobId) {
            this.update(this.job.jobId);
          }
        },
        (err) => this.errorService.showError("getting job events failed", err)
      );
  }

  // get job from session data and update state fields
  update(jobId: string) {
    if (jobId) {
      const job = this.sessionDataService.getJobById(jobId, this.sessionData.jobsMap);
      if (job) {
        this.job = job;
        this.isRunning = JobService.isRunning(job);
        this.failed = !JobService.isSuccessful(job);
        this.state = _.capitalize(job.state);
        this.screenOutput = job.screenOutput;
        this.duration = JobService.getDuration(job);

        this.outputDatasets = this.sessionDataService
          .getDatasetList(this.sessionData)
          .filter((d) => d.sourceJob === jobId);

        return;
      }
    }

    // no job found, clear
    this.job = null;
    this.isRunning = false;
    this.state = null;
    this.failed = false;
    this.screenOutput = null;
    this.duration = empty();
  }

  close() {
    this.selectionHandlerService.setJobSelection([]);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  cancelJob() {
    this.sessionDataService.cancelJob(this.job);
  }

  selectDataset(datasetId: string) {
    const dataset = this.getDataset(datasetId);
    this.selectionHandlerService.setDatasetSelection([dataset]);
    this.activeModal.close();
  }

  getDataset(datasetId: string) {
    return this.sessionData.datasetsMap.get(datasetId);
  }

  hasDataset(datasetId: string) {
    return this.getDataset(datasetId) != null;
  }

  getDatasetName(datasetId: string) {
    return this.getDataset(datasetId).name;
  }

  showWithTool(parameters: JobParameter[], tool: Tool) {
    this.isDefaultValueMap = new Map();

    parameters.forEach((jobParameter) => {
      const clone = _.clone(jobParameter);
      let isDefault = false;

      if (tool) {
        const toolParameter = tool.parameters.find((p) => p.name.id === jobParameter.parameterId);

        if (toolParameter) {
          // get the parameters display name from the tool
          clone.displayName = toolParameter.name.displayName;

          // if an enum parameter
          if (toolParameter.selectionOptions) {
            // find the value's display name from the tool
            const toolOption = toolParameter.selectionOptions.find((o) => o.id === jobParameter.value);
            if (toolOption) {
              if (toolOption.displayName) {
                clone.value = toolOption.displayName;
              }
            } else {
              log.warn(
                `job parameter value${jobParameter.value} not found from the current tool ` +
                  `paramater options, showing the id`
              );
            }
          }
          isDefault = this.toolService.isDefaultValue(toolParameter, jobParameter.value);
        }
      }
      this.isDefaultValueMap.set(clone, isDefault);
      this.parameterListForView.push(clone);
    });

    this.parameterListForView
      .filter((p) => p.displayName == null)
      .forEach((p) => {
        p.displayName = p.parameterId;
      });
  }

  getApplicationVersions() {
    return this.jobService.getApplicationVersions(this.job);
  }

  getRSessionInfo() {
    return this.jobService
      .getApplicationVersions(this.job)
      .filter((appVersion) => appVersion.application === "R Session Info")[0]?.version;
  }

  toggleRSessionInfo() {
    this.rSessionInfoVisible = !this.rSessionInfoVisible;
  }
}
