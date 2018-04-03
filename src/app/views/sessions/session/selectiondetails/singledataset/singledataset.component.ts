import Dataset from "../../../../../model/session/dataset";
import {SessionDataService} from "../../sessiondata.service";
import Job from "../../../../../model/session/job";
import {Component, Input, Output, EventEmitter, ViewChild, OnChanges, OnInit} from "@angular/core";
import {SessionData} from "../../../../../model/session/session-data";
import Tool from "../../../../../model/session/tool";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  selector: 'ch-single-dataset',
  templateUrl: './singledataset.html',
  styleUrls: ['./singledataset-component.less'],
})
export class SingleDatasetComponent implements OnInit, OnChanges {

  @Input() dataset: Dataset;
  @Input() private jobs: Map<string, Job>;
  @Input() private sessionData: SessionData;

  sourceJob: Job;
  private tool: Tool;
  toolCategory: string;
  toolName: string;

  notesPlaceholderInactive = 'click to edit';
  notesPlaceholderActive = 'notes about this file';

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService) {
  }

  ngOnInit() {
    this.sourceJob = this.getSourceJob(this.dataset);
  }

  ngOnChanges(changes: any) {
    this.dataset = changes.dataset.currentValue;
    this.sourceJob = this.getSourceJob(this.dataset);

    this.toolCategory = this.sourceJob ? this.sourceJob.toolCategory : '';
    this.toolName = this.sourceJob ? this.sourceJob.toolName : '';

    this.getUsedToolFromToolset();
  }

  editNotes(input) {
    input.placeholder = this.notesPlaceholderActive;
  }

  saveNotes(dataset: Dataset, input) {
    this.sessionDataService.updateDataset(dataset).subscribe(
      null,
      err => this.restErrorService.handleError(err, 'saving notes failed')
    );
    input.placeholder = this.notesPlaceholderInactive;
  }

  getSourceJob(dataset: Dataset) {
    return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
  }

  getUsedToolFromToolset() {
    if (this.sourceJob) {
      const i = this.sessionData.tools.findIndex(x => x.name.id === this.sourceJob.toolId);
      if (i !== -1) {
        this.tool = this.sessionData.tools[i];
      } else {
        console.log('No Tool found with this ID', this.sourceJob.toolId);
      }
    } else {
      console.log('source job is null');
    }
    /*
    this.sessionData.tools.forEach(function(tool){
      // imported files don't have sourceJob
      if (self.sourceJob) {
        if(tool.name.id===self.sourceJob.toolId){
          self.tool=tool;
        }
      }
    });
    console.log("input tool"+this.tool);*/
  }
}
