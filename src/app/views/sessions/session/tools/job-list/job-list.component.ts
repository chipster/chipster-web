import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { Job } from "chipster-js-common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { JobService } from "../../job.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";

@Component({
  selector: "ch-job-list",
  templateUrl: "./job-list.component.html",
  styleUrls: ["./job-list.component.less"],
})
export class JobListComponent implements OnChanges {
  @Input() jobs: Job[];
  jobsSorted: Job[];

  durationMap = new Map<string, Observable<string>>();
  runningJobCount = 0;

  @Output() private readonly jobSelected = new EventEmitter<Job>();

  constructor(
    private readonly selectionService: SelectionService,
    private readonly sessionDataService: SessionDataService,
    private readonly dialogModalService: DialogModalService,
    private readonly errorService: ErrorService,
  ) {}

  ngOnChanges() {
    this.jobsSorted = [...this.jobs].sort((a, b) => {
      const d1 = new Date(a.created).getTime();
      const d2 = new Date(b.created).getTime();
      return d2 - d1;
    });

    this.durationMap = new Map();
    this.jobsSorted.forEach((job) => {
      this.durationMap.set(job.jobId, this.createDurationObservable(job));
    });

    this.runningJobCount = this.jobsSorted.filter((job) => JobService.isRunning(job)).length;
  }

  isRunning(job: Job) {
    return JobService.isRunning(job);
  }

  getDurationObservable(job) {
    return this.durationMap.get(job.jobId);
  }

  selectJob(job: Job) {
    this.jobSelected.emit(job);
  }

  createDurationObservable(job: Job): Observable<string> {
    return JobService.getDuration(job).pipe(
      map((duration) => {
        if (duration === "0") {
          // incorrect information in the old sessions, no need to show
          return null;
        }
        return duration;
      }),
    );
  }

  cancelJob(job: Job) {
    this.sessionDataService.cancelJob(job)
      .catch((err) => this.errorService.showError(`Cancelling job failed for: ${job.toolName}`, err));
  }

  cancelAllJobs() {
    const count = this.runningJobCount;
    this.dialogModalService
      .openBooleanModal(
        "Cancel all jobs",
        `Are you sure you want to cancel ${count} running ${count === 1 ? "job" : "jobs"}?`,
        "Cancel all",
        "Close",
      )
      .then(
        () => {
          const runningJobs = (this.jobsSorted ?? []).filter((job) => JobService.isRunning(job));
          const promises = runningJobs.map((job) => this.sessionDataService.cancelJob(job));
          Promise.allSettled(promises).then((results) => {
            results.forEach((r, i) => {
              if (r.status === "rejected") {
                this.errorService.showError(`Cancelling job failed for: ${runningJobs[i].toolName}`, r.reason);
              }
            });
          });
        },
        () => {
          // modal dismissed
        },
      );
  }

  isSelectedJobById(jobId: string): boolean {
    return this.selectionService.isSelectedJobById(jobId);
  }
}
