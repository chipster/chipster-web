import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import {
  Dataset,
  Job,
  JobState,
  Tool,
  WorkflowInput,
  WorkflowJob,
  WorkflowPlan,
  WorkflowRun
} from "chipster-js-common";
import log from "loglevel";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import uuidv4 from "uuid/v4";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { SettingsService } from "../../../../../shared/services/settings.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";

@Component({
  selector: "ch-workflows",
  templateUrl: "./workflows.component.html",
  styleUrls: ["./workflows.component.less"]
})
export class WorkflowsComponent implements OnInit, OnDestroy {
  @Input()
  public sessionData: SessionData;

  @Input()
  public tools: Tool[];

  selectedDatasets: Dataset[] = [];
  workflowPlans: Array<WorkflowPlan>;
  workflowRuns: Array<WorkflowRun>;
  selectedWorkflowPlan: WorkflowPlan;
  selectedWorkflowRun: WorkflowRun;
  isRunnable = false;

  finishedStates = new Set<JobState>([
    JobState.Cancelled,
    JobState.Completed,
    JobState.Error,
    JobState.ExpiredWaiting,
    JobState.Failed,
    JobState.FailedUserError,
    JobState.Timeout
  ]);

  private unsubscribe: Subject<null> = new Subject();

  constructor(
    public settingsService: SettingsService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
    private store: Store<{}>,
    private dialogModalService: DialogModalService,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService
  ) {}

  ngOnInit(): void {
    this.workflowPlans = Array.from(this.sessionData.workflowPlansMap.values());
    this.workflowRuns = Array.from(this.sessionData.workflowRunsMap.values());

    this.store
      .select("selectedDatasets")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        datasets => {
          this.selectedDatasets = datasets;
        },
        err => {
          this.errorService.showError("workflow error", err);
        }
      );

    this.sessionEventService.getWorkflowPlanStream().subscribe(
      () => {
        this.workflowPlans = Array.from(
          this.sessionData.workflowPlansMap.values()
        );
      },
      err => this.errorService.showError("workflow plan event error", err)
    );

    this.sessionEventService.getWorkflowRunStream().subscribe(
      () => {
        this.workflowRuns = Array.from(
          this.sessionData.workflowRunsMap.values()
        );
      },
      err => this.errorService.showError("workflow run event error", err)
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  selectWorkflowPlan(plan: WorkflowPlan): void {
    this.selectedWorkflowRun = null;
    this.selectedWorkflowPlan = plan;

    this.isRunnable = this.bindInputs(plan, this.selectedDatasets);
  }

  bindInputs(plan: WorkflowPlan, datasets: Dataset[]) {
    const looseInputs = [];
    log.info("bind selected dataset to inputs of the selected workflow plan");
    plan.workflowJobs.forEach(job => {
      log.info("job " + job.toolId);
      job.inputs.forEach(input => {
        log.info("input '" + input.inputId + "'" + JSON.stringify(input));
        if (!input.sourceWorkflowJobId) {
          log.info(
            "found loose input for tool " +
              job.toolId +
              " input '" +
              input.inputId +
              "'"
          );
          looseInputs.push(input);
        }
      });
    });

    if (datasets.length === 0 && looseInputs.length === 0) {
      return true;
    } else if (datasets.length === 1 && looseInputs.length === 1) {
      // bind the dataset
      looseInputs[0].datasetId = datasets[0].datasetId;
      looseInputs[0].displayName = datasets[0].name;
      return true;
    } else if (looseInputs.length > 1) {
      log.info("workflow with multiple inputs isn't supported");
      return false;
    }
  }

  getJob(jobId: string): Job {
    let job = this.sessionData.jobsMap.get(jobId);
    if (!job) {
      job = new Job();

      if (this.finishedStates.has(this.selectedWorkflowRun.state)) {
        job.state = JobState.Cancelled;
      } else {
        job.state = JobState.Waiting;
      }
    }
    return job;
  }

  selectWorkflowRun(run: WorkflowRun): void {
    this.selectedWorkflowPlan = null;
    this.selectedWorkflowRun = run;
  }

  runWorkflowPlan(): void {
    const run = new WorkflowRun();
    run.state = JobState.New;
    run.name = this.selectedWorkflowPlan.name;
    run.workflowJobs = this.selectedWorkflowPlan.workflowJobs;
    this.sessionDataService
      .createWorkflowRun(run)
      .subscribe(null, err =>
        this.restErrorService.showError("run workflow error", err)
      );
  }

  deleteWorkflowPlan(plan: WorkflowPlan): void {
    if (this.selectedWorkflowPlan === plan) {
      this.selectedWorkflowPlan = null;
    }
    this.sessionDataService
      .deleteWorkflowPlan(plan)
      .subscribe(null, err =>
        this.restErrorService.showError("delete workflow plan error", err)
      );
  }

  deleteWorkflowRun(run: WorkflowRun): void {
    if (this.selectedWorkflowRun === run) {
      this.selectedWorkflowRun = null;
    }

    this.sessionDataService
      .deleteWorkflowRun(run)
      .subscribe(null, err =>
        this.restErrorService.showError("delete workflow run error", err)
      );
  }

  saveWorkflowDialog(): void {
    this.dialogModalService
      .openStringModal(
        "Save workflow",
        "Save workflow from the selected datasets",
        "New workflow",
        "Save"
      )
      .pipe(
        mergeMap(name => {
          const sourceJobs = this.getJobsToSave(this.selectedDatasets);
          log.info(
            "save workflow of " +
              this.selectedDatasets.length +
              " datasets and " +
              sourceJobs.size +
              " jobs"
          );
          return this.saveWorkflow(sourceJobs, name);
        })
      )
      .subscribe(null, err =>
        this.errorService.showError("workflow save error", err)
      );
  }

  /**
   * Infer which jobs to save into a workflow based on the selected datasets
   *
   * Include a job if any of it's inputs and output dataset is selected.
   *
   * Include also source jobs that don't have any inputs, because otherwise it wouldn't be
   * possible to include those to the workflow. If you want to save a workflow without it, you can
   * run a copy tool in between.
   *
   * This doesn't allow you to save tools that didn't produce any output. We could find those from the session
   * jobs, but I don't think we tools like that yet.
   *
   * @param datasets
   */
  getJobsToSave(datasets: Dataset[]) {
    const datasetIds = new Set(datasets.map(d => d.datasetId));

    const sourceJobIdSet = new Set<string>();
    this.selectedDatasets.forEach(d => {
      if (d.sourceJob) {
        const sourceJob = this.sessionData.jobsMap.get(d.sourceJob);
        if (sourceJob) {
          if (sourceJob.inputs.length === 0) {
            log.info(
              "source job " +
                sourceJob.toolId +
                " doesn't have any inputs, include in the workflow"
            );
            sourceJobIdSet.add(d.sourceJob);
          } else {
            const selectedInputDatasets = sourceJob.inputs.filter(i =>
              datasetIds.has(i.datasetId)
            );
            if (selectedInputDatasets.length > 0) {
              sourceJobIdSet.add(d.sourceJob);
            } else {
              log.info(
                "no inputs of the source job " +
                  sourceJob.toolId +
                  " was selected, don't include it in the worklow"
              );
            }
          }
        } else {
          log.info(
            "source job of dataset " + d.name + " is not found from the session"
          );
        }
      } else {
        log.info("dataset " + d.name + " doesn't have source job");
      }
    });

    return sourceJobIdSet;
  }

  saveWorkflow(sourceJobIdSet: Set<string>, name: string) {
    log.info("save workflow");

    const plan = new WorkflowPlan();
    plan.name = name;
    plan.workflowJobs = [];

    const sessionJobIdToWorkflowJobIdMap = new Map<string, string>();

    sourceJobIdSet.forEach(jobId => {
      // generate id for the workflow job
      sessionJobIdToWorkflowJobIdMap.set(jobId, uuidv4());
    });

    sourceJobIdSet.forEach(jobId => {
      const sourceJob = this.sessionData.jobsMap.get(jobId);
      log.info("save job " + sourceJob.toolId);

      const job = new WorkflowJob();

      job.workflowJobId = sessionJobIdToWorkflowJobIdMap.get(jobId);
      job.toolId = sourceJob.toolId;
      job.toolCategory = sourceJob.toolCategory;
      job.module = sourceJob.module;
      job.toolName = sourceJob.toolName;
      // job.parameters = Object.assign({}, sourceJob.parameters);
      // job.inputs = [...sourceJob.inputs];
      // job.metadataFiles = Object.assign({}, sourceJob.metadataFiles);

      job.inputs = [];

      sourceJob.inputs.forEach(sourceJobInput => {
        const workflowInput = this.getWorkflowInput(
          sourceJobInput,
          sessionJobIdToWorkflowJobIdMap
        );
        job.inputs.push(workflowInput);
      });

      plan.workflowJobs.push(job);

      log.info("inputs", job.inputs);
    });

    return this.sessionDataService.createWorkflowPlan(plan);
  }

  getWorkflowInput(sourceJobInput, sessionJobIdToWorkflowJobIdMap) {
    log.info("save input " + sourceJobInput.inputId);

    const workflowInput = new WorkflowInput();
    workflowInput.inputId = sourceJobInput.inputId;

    const dataset = this.sessionData.datasetsMap.get(sourceJobInput.datasetId);
    if (!dataset) {
      log.info("source dataset not found");
      // has to be given when the workflow is run
      return workflowInput;
    }
    const inputSourceJob = this.sessionData.jobsMap.get(dataset.sourceJob);

    if (!inputSourceJob) {
      log.info("the input source job not found");
      // has to be given when the workflow is run
      return workflowInput;
    }

    log.info(
      "tool " + inputSourceJob.toolId + " produced dataset " + dataset.name
    );

    // the id of the jobPlan whose output will be used for this input
    const inputWokrflowJobId = sessionJobIdToWorkflowJobIdMap.get(
      inputSourceJob.jobId
    );

    if (!inputWokrflowJobId) {
      log.info("the dataset isn't selected for this workflow");
      // has to be given when the workflow is run
      return workflowInput;
    }

    // the input is produced by some other job in this workflow
    workflowInput.sourceWorkflowJobId = inputWokrflowJobId;

    if (dataset.sourceJobOutputId == null) {
      throw new Error(
        "Workflow cannot be saved from dataset " +
          dataset.name +
          ". The dataset was created by a Chipster version which is too old. Please run the tool that produced this file again."
      );
    }
    workflowInput.sourceJobOutputId = dataset.sourceJobOutputId;

    log.info(
      "the input comes from tool " +
        inputSourceJob.toolId +
        " output " +
        workflowInput.sourceJobOutputId
    );

    return workflowInput;
  }
}
