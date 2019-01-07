import {SelectionService} from '../../selection.service';
import {SessionDataService} from '../../session-data.service';
import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import { Job, SessionEvent} from 'chipster-js-common';
import {JobService} from '../../job.service';
import {SessionEventService} from '../../session-event.service';
import {Subject} from 'rxjs/Subject';
import {SessionData} from '../../../../../model/session/session-data';
import * as _ from 'lodash';
import {SelectionHandlerService} from '../../selection-handler.service';
import { ErrorService } from '../../../../../core/errorhandler/error.service';

@Component({
  selector: 'ch-job',
  templateUrl: './job.html',
  styleUrls: ['./job.component.less']
})
export class JobComponent implements OnInit, OnDestroy {

  @Input() sessionData: SessionData;

  job: Job;
  isRunning: boolean;
  failed: boolean;
  state: string;
  screenOutput: string;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
  ) {
}

  ngOnInit() {

    // job selection events, get's current selection upon subscription
    this.selectionService.selectedJobs$
      .takeUntil(this.unsubscribe)
      .subscribe((selectedJobs: Array<Job>) => {
        let jobId = null;
        if (selectedJobs && selectedJobs.length > 0) {
          jobId = selectedJobs[0].jobId;
        }
        this.update(jobId);
      }, err => this.errorService.showError("updating selected jobs failed", err));

    // job modification events
    this.sessionEventService.getJobStream()
      .takeUntil(this.unsubscribe)
      .subscribe((sessionEvent: SessionEvent) => {
        if (this.job && sessionEvent.event.resourceId === this.job.jobId) {
          this.update(this.job.jobId);
        }
      }, err => this.errorService.showError("getting job events failed", err));
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
        return;
      }
    }

    // no job found, clear
    this.job = null;
    this.isRunning = false;
    this.state = null;
    this.failed = false;
    this.screenOutput = null;
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

}

