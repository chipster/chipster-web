import { Component, computed, inject, input, output } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Job } from "chipster-js-common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { JobService } from "../../job.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { NgClass, AsyncPipe } from "@angular/common";
import { LinkButtonComponent } from "../../link-button/link-button.component";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-job-list",
  templateUrl: "./job-list.component.html",
  styleUrls: ["./job-list.component.less"],
  imports: [NgClass, LinkButtonComponent, AsyncPipe, LocalDatePipe],
})
export class JobListComponent {
  private readonly selectionService = inject(SelectionService);
  private readonly sessionDataService = inject(SessionDataService);
  private readonly dialogModalService = inject(DialogModalService);
  private readonly errorService = inject(ErrorService);

  readonly jobs = input<Job[]>(undefined);

  readonly jobsSorted = computed(() =>
    [...this.jobs()].sort((a, b) => {
      const d1 = new Date(a.created).getTime();
      const d2 = new Date(b.created).getTime();
      return d2 - d1;
    }),
  );

  readonly durationMap = computed(
    () => new Map(this.jobsSorted().map((job) => [job.jobId, this.createDurationObservable(job)])),
  );

  readonly runningJobCount = computed(() => this.jobsSorted().filter((job) => JobService.isRunning(job)).length);

  // the arrow keys of the jobs modal and its auto-selection change it without an event in this view
  private readonly selectedJobs = toSignal(this.selectionService.selectedJobs$, { requireSync: true });

  readonly jobSelected = output<Job>();

  isRunning(job: Job) {
    return JobService.isRunning(job);
  }

  getDurationObservable(job) {
    return this.durationMap().get(job.jobId);
  }

  selectJob(job: Job) {
    this.jobSelected.emit(job);
  }

  public navigateJob(direction: 1 | -1): void {
    const jobsSorted = this.jobsSorted();
    if (!jobsSorted?.length) {
      return;
    }
    const current = jobsSorted.findIndex((j) => this.isSelectedJobById(j.jobId));
    const next = Math.max(0, Math.min(jobsSorted.length - 1, (current === -1 ? 0 : current) + direction));
    const job = jobsSorted[next];
    this.jobSelected.emit(job);
    document.getElementById(`job-id-${job.jobId}`)?.scrollIntoView({ block: "nearest" });
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
    this.sessionDataService
      .cancelJob(job)
      .catch((err) => this.errorService.showError(`Cancelling job failed for: ${job.toolName}`, err));
  }

  cancelAllJobs() {
    const count = this.runningJobCount();
    this.dialogModalService
      .openBooleanModal(
        "Cancel all jobs",
        `Are you sure you want to cancel ${count} running ${count === 1 ? "job" : "jobs"}?`,
        "Cancel all",
        "Close",
      )
      .then(
        () => {
          const runningJobs = this.jobsSorted().filter((job) => JobService.isRunning(job));
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
    return this.selectedJobs().some((job) => job.jobId === jobId);
  }
}
