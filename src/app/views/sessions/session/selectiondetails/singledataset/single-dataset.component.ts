import { Component, Input, OnChanges, OnInit, ViewChild } from "@angular/core";
import { Dataset, Job, Tool } from "chipster-js-common";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetContextMenuService } from "../../dataset.cotext.menu.service";
import { SessionDataService } from "../../session-data.service";
import { ToolService } from "../../tools/tool.service";
import { DatasetModalService } from "../datasetmodal.service";

@Component({
  selector: "ch-single-dataset",
  templateUrl: "./single-dataset.component.html",
  styleUrls: ["./single-dataset.component.less"],
})
export class SingleDatasetComponent implements OnInit, OnChanges {
  @Input()
  dataset: Dataset;
  @Input()
  private jobs: Map<string, Job>;
  @Input()
  private sessionData: SessionData;
  @Input()
  private tools: Tool[];
  @Input()
  parametersLimit: number;

  @ViewChild("notesInput")
  notesArea;

  sourceJob: Job;
  tool: Tool;
  toolCategory: string;
  toolName: string;

  notesPlaceholderInactive = "click to edit";
  notesPlaceholderActive = "";

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    private datasetModalService: DatasetModalService,
    private toolService: ToolService,
    private datasetContextMenuService: DatasetContextMenuService
  ) {}

  ngOnInit() {
    this.sourceJob = this.getSourceJob(this.dataset);
  }

  ngOnChanges(changes: any) {
    this.dataset = changes.dataset.currentValue;
    this.sourceJob = this.getSourceJob(this.dataset);

    this.toolCategory = this.sourceJob ? this.sourceJob.toolCategory : "";
    this.toolName = this.sourceJob ? this.sourceJob.toolName : "";

    this.tool = this.toolService.getLiveToolForSourceJob(this.sourceJob, this.tools);
  }

  editNotes(input) {
    input.placeholder = this.notesPlaceholderActive;
  }

  saveNotes(dataset: Dataset, input) {
    this.notesArea.nativeElement.scrollTop = 0;

    this.sessionDataService
      .updateDataset(dataset)
      .subscribe(null, (err) => this.restErrorService.showError("saving notes failed", err));
    input.placeholder = this.notesPlaceholderInactive;
  }

  getSourceJob(dataset: Dataset) {
    return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
  }

  showHistory(): void {
    this.datasetModalService.openDatasetHistoryModal(this.dataset, this.sessionData, this.tools);
  }

  selectTool() {
    this.datasetContextMenuService.selectTool(this.sourceJob);
  }

  showJob() {
    this.datasetContextMenuService.showJob(this.sourceJob, this.tools, this.sessionData);
  }
}
