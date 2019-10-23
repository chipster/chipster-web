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
import { combineLatest, Observable, Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import uuidv4 from "uuid/v4";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import {
  ErrorMessage,
  Level
} from "../../../../../core/errorhandler/errormessage";
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
  selectedWorkflowPlan$ = new Subject<WorkflowPlan>();
  selectedWorkflowRun$ = new Subject<WorkflowRun>();
  selectedWorkflowPlan: WorkflowPlan;
  selectedWorkflowRun: WorkflowRun;
  isRunnable = false;
  jobsOfSelectedWorkflowRun: Job[];

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
  countsOfSelectedWorkflowRun: string;

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

    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.updateWorkflowRunJobs();
        },
        err => this.errorService.showError("failed to update jobs", err)
      );

    this.sessionEventService
      .getWorkflowPlanStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.workflowPlans = Array.from(
            this.sessionData.workflowPlansMap.values()
          );
          if (this.selectedWorkflowPlan != null) {
            this.selectedWorkflowPlan = this.sessionData.workflowPlansMap.get(
              this.selectedWorkflowPlan.workflowPlanId
            );
          }
        },
        err => this.errorService.showError("workflow plan event error", err)
      );

    this.sessionEventService
      .getWorkflowRunStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.workflowRuns = Array.from(
            this.sessionData.workflowRunsMap.values()
          );
          if (this.selectedWorkflowRun != null) {
            this.selectedWorkflowRun = this.sessionData.workflowRunsMap.get(
              this.selectedWorkflowRun.workflowRunId
            );
          }
        },
        err => this.errorService.showError("workflow run event error", err)
      );

    this.selectedWorkflowRun$.pipe(takeUntil(this.unsubscribe)).subscribe(
      run => {
        this.selectedWorkflowRun = run;
        this.updateWorkflowRunJobs();
      },
      err => this.errorService.showError("workflow run selection error", err)
    );

    this.selectedWorkflowPlan$.pipe(takeUntil(this.unsubscribe)).subscribe(
      plan => {
        this.selectedWorkflowPlan = plan;
      },
      err => this.errorService.showError("workflow plan selection error", err)
    );

    combineLatest(
      this.store.select("selectedDatasets"),
      this.selectedWorkflowPlan$
    )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        ([selectedDatasets, selectedWorkflowPlan]) => {
          this.isRunnable = this.bindInputs(
            selectedWorkflowPlan,
            selectedDatasets
          );
        },
        err =>
          this.errorService.showError(
            "binding selected datasets to selected workflow plan failed",
            err
          )
      );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  selectWorkflowPlan(plan: WorkflowPlan): void {
    this.selectedWorkflowRun$.next(null);
    this.selectedWorkflowPlan$.next(plan);
  }

  selectWorkflowRun(run: WorkflowRun): void {
    this.selectedWorkflowRun$.next(run);
    this.selectedWorkflowPlan$.next(null);
  }

  bindInputs(plan: WorkflowPlan, datasets: Dataset[]): boolean {
    if (plan == null) {
      return false;
    }

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

    // many loose inputs can use the same dataset
    const uniqueLooseWorkflowDatasetIds = new Set<string>();
    looseInputs.forEach(i => uniqueLooseWorkflowDatasetIds.add(i.datasetId));

    log.info("loose inputs", looseInputs);
    log.info("unique", uniqueLooseWorkflowDatasetIds);

    if (datasets.length === 0 && uniqueLooseWorkflowDatasetIds.size === 0) {
      return true;
    } else if (
      datasets.length === 1 &&
      uniqueLooseWorkflowDatasetIds.size === 1
    ) {
      // bind the dataset
      // many loose inputs can use the same dataset
      const uniqueWorkflowDatasetId = uniqueLooseWorkflowDatasetIds
        .values()
        .next().value;

      log.info("bind dataset", uniqueWorkflowDatasetId, looseInputs);
      looseInputs
        .filter(i => i.datasetId === uniqueWorkflowDatasetId)
        .forEach(i => {
          i.datasetId = datasets[0].datasetId;
          i.displayName = datasets[0].name;
        });
      return true;
    } else if (uniqueLooseWorkflowDatasetIds.size > 1) {
      log.info("workflow with multiple inputs isn't supported");
      return false;
    }
  }

  getJobForView(jobId: string): Job {
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

  updateWorkflowRunJobs(): void {
    if (this.selectedWorkflowRun == null) {
      this.jobsOfSelectedWorkflowRun = [];
    } else {
      this.jobsOfSelectedWorkflowRun = this.selectedWorkflowRun.workflowJobs.map(
        j => this.getJobForView(j.jobId)
      );

      const completedCount = this.jobsOfSelectedWorkflowRun.filter(
        j => j.state === JobState.Completed
      ).length;
      const totalCount = this.jobsOfSelectedWorkflowRun.length;

      this.countsOfSelectedWorkflowRun = completedCount + "/" + totalCount;
    }
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
    const names = new Set(
      Array.from(this.sessionData.workflowPlansMap.values()).map(p => p.name)
    );
    const nameBase = "New workflow";
    let defaultName = nameBase;
    for (let i = 2; names.has(defaultName); i++) {
      defaultName = nameBase + " " + i;
    }

    const sourceJobs = this.getJobsToSave(this.selectedDatasets);

    if (sourceJobs.size === 0) {
      const errorMessage = new ErrorMessage(
        "No jobs found",
        "Please select both an input and output dataset of each jobs to save.",
        true,
        [],
        [],
        null
      );
      errorMessage.level = Level.Info;
      this.errorService.showErrorObject(errorMessage);
      return;
    }

    this.dialogModalService
      .openStringModal(
        "Save workflow",
        "Save workflow from the selected datasets",
        defaultName,
        "Save"
      )
      .pipe(
        mergeMap(name => {
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
  getJobsToSave(datasets: Dataset[]): Set<string> {
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

  saveWorkflow(sourceJobIdSet: Set<string>, name: string): Observable<string> {
    log.info("save workflow");

    const plan = new WorkflowPlan();
    plan.name = name;
    plan.workflowJobs = [];

    const jobIdToWorkflowJobIdMap = new Map<string, string>();
    const datasetIdToWorkflowDatasetIdMap = new Map<string, string>();

    sourceJobIdSet.forEach(jobId => {
      // generate ids for workflow jobs
      jobIdToWorkflowJobIdMap.set(jobId, uuidv4());
    });

    for (const datasetId of Array.from(this.sessionData.datasetsMap.keys())) {
      // generate ids for workflow datasets
      // these are used only to know when multiple jobs used the same dataset for input
      datasetIdToWorkflowDatasetIdMap.set(datasetId, uuidv4());
    }

    sourceJobIdSet.forEach(jobId => {
      const sourceJob = this.sessionData.jobsMap.get(jobId);
      log.info("save job " + sourceJob.toolId);

      const job = new WorkflowJob();

      job.workflowJobId = jobIdToWorkflowJobIdMap.get(jobId);
      job.toolId = sourceJob.toolId;
      job.toolCategory = sourceJob.toolCategory;
      job.module = sourceJob.module;
      job.toolName = sourceJob.toolName;
      job.parameters = [...sourceJob.parameters];
      //TODO should the phenodata be saved with the workflow or come from the session where it's run?
      job.metadataFiles = [...sourceJob.metadataFiles];

      job.inputs = [];

      sourceJob.inputs.forEach(sourceJobInput => {
        const workflowInput = this.getWorkflowInput(
          sourceJobInput,
          jobIdToWorkflowJobIdMap,
          datasetIdToWorkflowDatasetIdMap
        );
        job.inputs.push(workflowInput);
      });

      plan.workflowJobs.push(job);

      log.info("inputs", job.inputs);
    });

    return this.sessionDataService.createWorkflowPlan(plan);
  }

  getWorkflowInput(
    sourceJobInput,
    sessionJobIdToWorkflowJobIdMap,
    sessionDatasetIdToWorkflowDatasetIdMap
  ): WorkflowInput {
    log.info("save input " + sourceJobInput.inputId);

    const workflowInput = new WorkflowInput();
    workflowInput.inputId = sourceJobInput.inputId;

    const dataset = this.sessionData.datasetsMap.get(sourceJobInput.datasetId);
    if (!dataset) {
      log.info("source dataset not found");
      // can these happen, when missing datasets cannot be selected for the workflow saving?
      // If it can, we could generate new workflow ids also missing datasets, just like we done for the session datasets.
      throw new Error(
        "input '" +
          sourceJobInput.inputId +
          "' came from dataset " +
          sourceJobInput.datasetId +
          " but it's not anymore in the session"
      );
      // return workflowInput;
    }
    const inputSourceJob = this.sessionData.jobsMap.get(dataset.sourceJob);

    // a real dataset has to be given when the workflow is run
    // but add a fake "workflow dataset" id to know when multiple jobs use the same dataset
    workflowInput.datasetId = sessionDatasetIdToWorkflowDatasetIdMap.get(
      sourceJobInput.datasetId
    );

    if (!inputSourceJob) {
      log.info("the input source job not found");
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
    // the input is bound to job output, clear this
    workflowInput.datasetId = null;

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
