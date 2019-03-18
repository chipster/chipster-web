import { SelectionService } from '../../selection.service';
import { SessionDataService } from '../../session-data.service';
import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { Job, SessionEvent, JobParameter, Tool } from 'chipster-js-common';
import { JobService } from '../../job.service';
import { SessionEventService } from '../../session-event.service';
import { Subject } from 'rxjs/Subject';
import { SessionData } from '../../../../../model/session/session-data';
import * as _ from 'lodash';
import UtilsService from '../../../../../shared/utilities/utils';
import { SelectionHandlerService } from '../../selection-handler.service';
import { ErrorService } from '../../../../../core/errorhandler/error.service';
import { ToolService } from '../../tools/tool.service';

@Component({
  selector: 'ch-job',
  templateUrl: './job.html',
  styleUrls: ['./job.component.less']
})
export class JobComponent implements OnInit, OnDestroy {

  @Input() sessionData: SessionData;
  @Input() tools: Tool[];

  job: Job;
  isRunning: boolean;
  failed: boolean;
  state: string;
  screenOutput: string;
  duration = "";
  tool: Tool;
  parameterLimit = 12;

  private unsubscribe: Subject<any> = new Subject();
  // noinspection JSMismatchedCollectionQueryUpdate
  parameterListForView: Array<JobParameter> = [];
  isDefaultValueMap: Map<JobParameter, boolean> = new Map();

  constructor(
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
    private toolService: ToolService
  ) {
  }

  ngOnInit() {

    // job selection events, get's current selection upon subscription
    this.selectionService.selectedJobs$
      .takeUntil(this.unsubscribe)
      .subscribe((selectedJobs: Array<Job>) => {
        this.isDefaultValueMap.clear();
        this.parameterListForView = [];
        let jobId = null;
        if (selectedJobs && selectedJobs.length > 0) {
          jobId = selectedJobs[0].jobId;
          const job = this.sessionDataService.getJobById(jobId, this.sessionData.jobsMap);
          if (job) {
            this.tool = this.tools.find(t => t.name.id === job.toolId);
            if (this.tool) {
              this.showWithTool(job.parameters, this.tool);
            }
            if (!this.tool) {
              console.log("No Tool found with this ID", this.job.toolId);
            }
          } else {
            console.log("source job is null");
          }

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
        if (this.job.startTime != null && this.job.endTime != null) {
          const computingTime = UtilsService.parseISOStringToDate(this.job.endTime).getTime() -
            UtilsService.parseISOStringToDate(this.job.startTime).getTime();
          if (computingTime > 1000) {
            this.duration = UtilsService.convertMS(computingTime);
          } else {
            this.duration = computingTime.toString() + "ms";
          }
        }

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

  showWithTool(parameters: JobParameter[], tool: Tool) {
    this.isDefaultValueMap = new Map();

    parameters.forEach(jobParameter => {
      const clone = _.clone(jobParameter);
      let isDefault = false;

      if (tool) {
        const toolParameter = tool.parameters.find(
          p => p.name.id === jobParameter.parameterId
        );

        if (toolParameter) {
          // get the parameters display name from the tool
          clone.displayName = toolParameter.name.displayName;

          // if an enum parameter
          if (toolParameter.selectionOptions) {
            // find the value's display name from the tool
            const toolOption = toolParameter.selectionOptions.find(
              o => o.id === jobParameter.value
            );
            if (toolOption) {
              if (toolOption.displayName) {
                clone.value = toolOption.displayName;
              }
            } else {
              console.warn(
                "job parameter value" +
                jobParameter.value +
                "not found from the current tool " +
                "paramater options, showing the id"
              );
            }
          }
          isDefault = this.toolService.isDefaultValue(
            toolParameter,
            jobParameter.value
          );
        }
      }
      this.isDefaultValueMap.set(clone, isDefault);
      this.parameterListForView.push(clone);
    });

    this.parameterListForView.filter(p => p.displayName == null).forEach(p => {
      p.displayName = p.parameterId;
    });
  }

}

