import { AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Job, Tool } from "chipster-js-common";
import log from "loglevel";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";
import { JobListComponent } from "../tools/job-list/job-list.component";

@Component({
  selector: "ch-jobs-modal",
  templateUrl: "./jobs-modal.component.html",
  styleUrls: ["./jobs-modal.component.less"],
})
export class JobsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public activeModal: NgbActiveModal,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
    private sessionDataService: SessionDataService,
  ) {}

  ngOnInit(): void {
    this.updateJobs();
    this.subscribeToJobEvents();
  }

  ngAfterViewInit() {
    // scroll to the job when it's selected from "Show job" in File context menu
    // don't scroll after every job selection event, otherwise this modal is unusable
    const jobs = this.selectionService.selectedJobs;

    if (jobs.length === 1) {
      const rowId = "job-id-" + jobs[0].jobId;
      const el = document.getElementById(rowId);
      if (el != null) {
        el.scrollIntoView();
      } else {
        log.warn("scrolling to job failed, element id not found: ", rowId);
      }
    } else if (this.jobListComponent?.jobsSorted.length > 0) {
      // auto-select first job to enable immediate arrow key navigation; setTimeout defers past view check cycle (NG0100)
      setTimeout(() => this.onJobSelection(this.jobListComponent.jobsSorted[0]));
    }
  }

  @ViewChild(JobListComponent) jobListComponent!: JobListComponent;

  jobs: Job[];
  @Input() tools: Tool[];
  @Input() sessionData: SessionData;

  /**
   * Job selection goes through selectionHandlerService, bit overkill atm.
   *
   * @param job
   *
   */
  @HostListener("keydown", ["$event"])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.jobListComponent?.navigateJob(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.jobListComponent?.navigateJob(-1);
    }
  }

  onJobSelection(job: Job) {
    this.selectionHandlerService.setJobSelection([job]);
  }

  updateJobs() {
    this.jobs = this.sessionDataService.getJobList(this.sessionData);
  }

  private subscribeToJobEvents() {
    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.updateJobs();
        },
        (err) => this.errorService.showError("failed to update jobs", err),
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
