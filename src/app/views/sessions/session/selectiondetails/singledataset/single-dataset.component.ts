import {
  Component,
  OnChanges,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  input,
  viewChild,
  ElementRef,
} from "@angular/core";
import { Dataset, Job, Tool } from "chipster-js-common";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetContextMenuService } from "../../dataset.cotext.menu.service";
import { getSortedLabels } from "../../labels/labels-util";
import { SessionDataService } from "../../session-data.service";
import { ToolService } from "../../tools/tool.service";
import { DatasetModalService } from "../datasetmodal.service";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";
import { DatasetParameterListComponent } from "../dataset-parameter-list/dataset-parameter-list.component";
import { LinkButtonComponent } from "../../link-button/link-button.component";
import { LabelPillComponent } from "../../labels/label-pill.component";
import { FormsModule } from "@angular/forms";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-single-dataset",
  templateUrl: "./single-dataset.component.html",
  styleUrls: ["./single-dataset.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NGB_DROPDOWN_IMPORTS,
    DatasetParameterListComponent,
    LinkButtonComponent,
    LabelPillComponent,
    FormsModule,
    BytesPipe,
    LocalDatePipe,
  ],
})
export class SingleDatasetComponent implements OnInit, OnChanges {
  private sessionDataService = inject(SessionDataService);
  private restErrorService = inject(RestErrorService);
  private datasetModalService = inject(DatasetModalService);
  private toolService = inject(ToolService);
  private datasetContextMenuService = inject(DatasetContextMenuService);

  readonly dataset = input<Dataset>(undefined);
  readonly jobs = input<Map<string, Job>>(undefined);
  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);
  readonly parametersLimit = input<number>(undefined);

  readonly notesArea = viewChild<ElementRef<HTMLTextAreaElement>>("notesInput");

  sourceJob: Job;
  tool: Tool;
  toolCategory: string;
  toolName: string;

  notesPlaceholderInactive = "click to edit";
  notesPlaceholderActive = "";

  ngOnInit() {
    this.sourceJob = this.getSourceJob(this.dataset());
  }

  ngOnChanges() {
    this.sourceJob = this.getSourceJob(this.dataset());

    this.toolCategory = this.sourceJob ? this.sourceJob.toolCategory : "";
    this.toolName = this.sourceJob ? this.sourceJob.toolName : "";

    this.tool = this.toolService.getLiveToolForSourceJob(this.sourceJob, this.tools());
  }

  editNotes(notesInput) {
    notesInput.placeholder = this.notesPlaceholderActive;
  }

  saveNotes(dataset: Dataset, notesInput) {
    this.notesArea().nativeElement.scrollTop = 0;

    this.sessionDataService
      .updateDataset(dataset)
      .subscribe({ error: (err) => this.restErrorService.showError("saving notes failed", err) });
    notesInput.placeholder = this.notesPlaceholderInactive;
  }

  getSourceJob(dataset: Dataset) {
    return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs());
  }

  showHistory(): void {
    this.datasetModalService.openDatasetHistoryModal(this.dataset(), this.sessionData(), this.tools());
  }

  selectTool() {
    this.datasetContextMenuService.selectTool(this.sourceJob);
  }

  showJob() {
    this.datasetContextMenuService.showJob(this.sourceJob, this.tools(), this.sessionData());
  }

  editLabels(): void {
    this.datasetModalService.openLabelsModal([this.dataset()], this.sessionData());
  }

  getDatasetLabels() {
    return getSortedLabels(this.dataset()?.labelIds, this.sessionData().labelsMap);
  }
}
