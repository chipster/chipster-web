import Dataset from "../../../../../model/session/dataset";
import { SessionDataService } from "../../sessiondata.service";
import Job from "../../../../../model/session/job";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  OnInit
} from "@angular/core";
import { SessionData } from "../../../../../model/session/session-data";
import Tool from "../../../../../model/session/tool";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-single-dataset",
  templateUrl: "./single-dataset.component.html",
  styleUrls: ["./single-dataset.component.less"]
})
export class SingleDatasetComponent implements OnInit, OnChanges {
  @Input() dataset: Dataset;
  @Input() private jobs: Map<string, Job>;
  @Input() private sessionData: SessionData;
  @Input() parametersLimit: number;

  @ViewChild("notesInput") notesArea;

  sourceJob: Job;
  private tool: Tool;
  toolCategory: string;
  toolName: string;

  notesPlaceholderInactive = "click to edit";
  notesPlaceholderActive = "";

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService
  ) {}

  ngOnInit() {
    this.sourceJob = this.getSourceJob(this.dataset);
  }

  ngOnChanges(changes: any) {
    this.dataset = changes.dataset.currentValue;
    this.sourceJob = this.getSourceJob(this.dataset);

    this.toolCategory = this.sourceJob ? this.sourceJob.toolCategory : "";
    this.toolName = this.sourceJob ? this.sourceJob.toolName : "";

    this.getUsedToolFromToolset();
  }

  editNotes(input) {
    input.placeholder = this.notesPlaceholderActive;
  }

  saveNotes(dataset: Dataset, input) {
    this.notesArea.nativeElement.scrollTop = 0;

    this.sessionDataService
      .updateDataset(dataset)
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "saving notes failed")
      );
    input.placeholder = this.notesPlaceholderInactive;
  }

  getSourceJob(dataset: Dataset) {
    return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
  }

  getUsedToolFromToolset() {
    if (this.sourceJob) {
      this.tool = this.sessionData.tools.find(
        t => t.name.id === this.sourceJob.toolId
      );

      if (!this.tool) {
        console.log("No Tool found with this ID", this.sourceJob.toolId);
      }
    } else {
      console.log("source job is null");
    }
  }
}