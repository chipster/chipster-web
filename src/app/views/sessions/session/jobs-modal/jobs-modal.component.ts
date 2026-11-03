import { AfterViewInit, Component, HostListener, computed, inject, signal, viewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Job, Tool } from "chipster-js-common";
import log from "loglevel";
import { SessionData } from "../../../../model/session/session-data";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { SessionDataService } from "../session-data.service";
import { JobListComponent } from "../tools/job-list/job-list.component";
import { JobComponent } from "../selectiondetails/job/job.component";

@Component({
  selector: "ch-jobs-modal",
  templateUrl: "./jobs-modal.component.html",
  styleUrls: ["./jobs-modal.component.less"],
  imports: [JobListComponent, JobComponent],
})
export class JobsModalComponent implements AfterViewInit {
  activeModal = inject(NgbActiveModal);
  private selectionHandlerService = inject(SelectionHandlerService);
  private selectionService = inject(SelectionService);
  private sessionDataService = inject(SessionDataService);

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
    } else if (this.jobListComponent()?.jobsSorted().length > 0) {
      // auto-select first job to enable immediate arrow key navigation; setTimeout defers past view check cycle (NG0100)
      setTimeout(() => this.onJobSelection(this.jobListComponent().jobsSorted()[0]));
    }
  }

  readonly jobListComponent = viewChild.required(JobListComponent);

  // set through the modal ref by the code that opens the modal
  readonly tools = signal<Tool[]>(undefined);
  readonly sessionData = signal<SessionData>(undefined);

  // job events update jobsMap
  readonly jobs = computed<Job[]>(() => this.sessionDataService.getJobList(this.sessionData()));

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
      this.jobListComponent()?.navigateJob(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.jobListComponent()?.navigateJob(-1);
    }
  }

  onJobSelection(job: Job) {
    this.selectionHandlerService.setJobSelection([job]);
  }
}
