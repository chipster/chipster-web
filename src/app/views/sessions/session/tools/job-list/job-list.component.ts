import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";
import { Job } from "chipster-js-common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
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

  @Output() private jobSelected = new EventEmitter<Job>();

  constructor(
    private dropDown: NgbDropdown,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService
  ) {}

  ngOnChanges() {
    this.jobsSorted = this.jobs.sort((a, b) => {
      const d1 = new Date(a.created).getTime();
      const d2 = new Date(b.created).getTime();
      return d2 - d1;
    });

    this.durationMap = new Map();
    this.jobsSorted.forEach((job) => {
      this.durationMap.set(job.jobId, this.createDurationObservable(job));
    });
  }

  isRunning(job: Job) {
    return JobService.isRunning(job);
  }

  getDurationObservable(job) {
    return this.durationMap.get(job.jobId);
  }

  selectJob(job: Job) {
    this.jobSelected.emit(job);
    this.dropDown.close();
  }

  closeDropDown() {
    this.dropDown.close();
  }

  createDurationObservable(job: Job): Observable<string> {
    return JobService.getDuration(job).pipe(
      map((duration) => {
        if (duration === "0") {
          // incorrect information in the old sessions, no need to show
          return null;
        }
        return duration;
      })
    );
  }

  cancelJob(job: Job) {
    this.sessionDataService.cancelJob(job);
  }

  isSelectedJobById(jobId: string): boolean {
    return this.selectionService.isSelectedJobById(jobId);
  }
}
