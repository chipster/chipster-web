import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import {
  Dataset,
  JobState,
  WorkflowJobPlan,
  WorkflowPlan,
  WorkflowRun
} from "chipster-js-common";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { SettingsService } from "../../../../../shared/services/settings.service";

@Component({
  selector: "ch-workflows",
  templateUrl: "./workflows.component.html",
  styleUrls: ["./workflows.component.less"]
})
export class WorkflowsComponent implements OnInit, OnDestroy {
  @Input()
  public sessionData: SessionData;

  selectedDatasets: Dataset[] = [];
  workflowPlans: Array<WorkflowPlan>;
  workflowRuns: Array<WorkflowRun>;
  selectedWorkflowPlan: WorkflowPlan;
  selectedWorkflowRun: WorkflowRun;
  selectedWorkflowRunJobs: any[] = [];

  private unsubscribe: Subject<null> = new Subject();
  s;

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
  }

  selectWorkflowRun(run: WorkflowRun): void {
    this.selectedWorkflowPlan = null;
    this.selectedWorkflowRun = run;

    if (run.workflowPlanId) {
      const plan = this.sessionData.workflowPlansMap.get(run.workflowPlanId);
      if (plan != null) {
        this.selectedWorkflowRunJobs = [];

        let defaultState = "NEW";
        if (run.currentJobPlanId != null) {
          defaultState = "COMPLETED";
        }
        plan.workflowJobPlans.forEach(jobPlan => {
          const jobState = {
            toolName: jobPlan.toolName,
            state: defaultState
          };

          if (run.currentWorkflowJobPlanId === jobPlan.workflowJobPlanId) {
            //FIXME rename currentJobPlanId to currentJobId
            if (run.currentJobPlanId != null) {
              defaultState = "WAITING";
              const job = this.sessionData.jobsMap.get(run.currentJobPlanId);
              if (job != null) {
                jobState.state = job.state;
              } else {
                jobState.state = "UNKNOWN";
              }
            } else {
              jobState.state = "UNKNOWN";
            }
          }

          this.selectedWorkflowRunJobs.push(jobState);
        });
      }
    }
  }

  runWorkflowPlan(): void {
    const run = new WorkflowRun();
    run.state = JobState.New;
    run.workflowPlanId = this.selectedWorkflowPlan.workflowPlanId;
    run.name = this.selectedWorkflowPlan.name;
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

  saveWorkflow(): void {
    this.dialogModalService
      .openStringModal(
        "Save workflow",
        "Save workflow from the selected datasets",
        "New workflow",
        "Save"
      )
      .pipe(
        mergeMap(name => {
          const plan = new WorkflowPlan();
          plan.name = name;
          plan.workflowJobPlans = [];
          this.selectedDatasets.forEach(d => {
            const sourceJob = this.sessionData.jobsMap.get(d.sourceJob);
            const job = new WorkflowJobPlan();
            job.toolId = sourceJob.toolId;
            job.toolCategory = sourceJob.toolCategory;
            job.module = sourceJob.module;
            job.toolName = sourceJob.toolName;
            // job.parameters = Object.assign({}, sourceJob.parameters);
            // job.inputs = Object.assign({}, sourceJob.inputs);
            // job.metadataFiles = Object.assign({}, sourceJob.metadataFiles);
            plan.workflowJobPlans.push(job);
          });
          return this.sessionDataService.createWorkflowPlan(plan);
        })
      )
      .subscribe(null, err =>
        this.errorService.showError("workflow save error", err)
      );
  }
}
