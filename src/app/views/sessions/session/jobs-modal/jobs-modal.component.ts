import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Job, Tool } from "chipster-js-common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SelectionHandlerService } from "../selection-handler.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";

@Component({
  selector: "ch-jobs-modal",
  templateUrl: "./jobs-modal.component.html",
  styleUrls: ["./jobs-modal.component.less"],
})
export class JobsModalComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public activeModal: NgbActiveModal,
    private selectionHandlerService: SelectionHandlerService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
    private sessionDataService: SessionDataService
  ) {}

  ngOnInit(): void {
    this.updateJobs();
    this.subscribeToJobEvents();
  }

  jobs: Job[];
  @Input() tools: Tool[];
  @Input() sessionData: SessionData;

  /**
   * Job selection goes through selectionHandlerService, bit overkill atm.
   *
   * @param job
   *
   */
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
        (err) => this.errorService.showError("failed to update jobs", err)
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
