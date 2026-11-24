import { Component, ElementRef, computed, inject, input, linkedSignal, viewChild } from "@angular/core";
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
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-single-dataset",
  templateUrl: "./single-dataset.component.html",
  styleUrls: ["./single-dataset.component.less"],
  imports: [
    NGB_DROPDOWN_IMPORTS,
    DatasetParameterListComponent,
    LinkButtonComponent,
    LabelPillComponent,
    BytesPipe,
    LocalDatePipe,
  ],
})
export class SingleDatasetComponent {
  private sessionDataService = inject(SessionDataService);
  private restErrorService = inject(RestErrorService);
  private datasetModalService = inject(DatasetModalService);
  private toolService = inject(ToolService);
  private datasetContextMenuService = inject(DatasetContextMenuService);

  readonly dataset = input.required<Dataset>();
  readonly jobs = input<ReadonlyMap<string, Job>>(undefined);
  readonly sessionData = input.required<SessionData>();
  readonly tools = input<Tool[]>(undefined);
  readonly parametersLimit = input<number>(undefined);

  readonly notesArea = viewChild<ElementRef<HTMLTextAreaElement>>("notesInput");

  /*
   * The latest copy from datasetsMap, because the dataset of the selection isn't updated by the
   * dataset events: labels and notes changed elsewhere, or the server's copy after a local change.
   */
  readonly latestDataset = computed(() => this.sessionData().latestDatasets([this.dataset()])[0]);
  readonly sourceJob = computed<Job>(() =>
    this.sessionDataService.getJobById(this.latestDataset().sourceJob, this.jobs()),
  );
  readonly toolCategory = computed(() => this.sourceJob()?.toolCategory ?? "");
  readonly toolName = computed(() => this.sourceJob()?.toolName ?? "");
  readonly tool = computed<Tool>(() => this.toolService.getLiveToolForSourceJob(this.sourceJob(), this.tools()));
  // a signal of its own, so that the kept text below goes only when the notes change, not on every new
  // copy of the file
  private readonly savedNotes = computed(() => this.latestDataset().notes ?? "");
  // the typed notes whose save failed, kept in the box for a retry or a copy until the user leaves the
  // box or the saved notes change, e.g. elsewhere
  private readonly unsavedNotes = linkedSignal<string, string | null>({
    source: this.savedNotes,
    computation: () => null,
  });
  // the text of the notes textarea: the latest notes, or the typed text when its save failed
  readonly notesText = computed(() => this.unsavedNotes() ?? this.savedNotes());
  // the number of the latest save, to tell its failure from an older save's
  private saves = 0;

  notesPlaceholderInactive = "click to edit";
  notesPlaceholderActive = "";

  editNotes(notesInput: HTMLTextAreaElement) {
    notesInput.placeholder = this.notesPlaceholderActive;
  }

  saveNotes(notesInput: HTMLTextAreaElement) {
    this.notesArea().nativeElement.scrollTop = 0;
    notesInput.placeholder = this.notesPlaceholderInactive;
    // leaving the box ends the kept text, whether it is saved or changed back
    this.unsavedNotes.set(null);

    const savedNotes = this.savedNotes();
    if (notesInput.value === savedNotes) {
      return;
    }

    // the copy in datasetsMap at once, so that an update of the dataset sent before the save's event
    // arrives, e.g. a label applied with the next click, carries the new notes
    const save = ++this.saves;
    const dataset = { ...this.latestDataset(), notes: notesInput.value };
    const restore = this.sessionData().setDatasets([dataset]);
    this.sessionDataService.updateDataset(dataset).subscribe({
      error: (err) => {
        restore();
        // keep the text unless a newer save replaced it, or the notes changed during the save: a label
        // applied meanwhile that sent these notes after all, or a change made elsewhere
        const latestNotes = this.sessionData().datasetsMap().get(dataset.datasetId)?.notes ?? "";
        if (save === this.saves && latestNotes === savedNotes) {
          this.unsavedNotes.set(dataset.notes);
        }
        this.restErrorService.showError("saving notes failed", err);
      },
    });
  }

  showHistory(): void {
    this.datasetModalService.openDatasetHistoryModal(this.latestDataset(), this.sessionData(), this.tools());
  }

  selectTool() {
    this.datasetContextMenuService.selectTool(this.sourceJob());
  }

  showJob() {
    this.datasetContextMenuService.showJob(this.sourceJob(), this.tools(), this.sessionData());
  }

  editLabels(): void {
    this.datasetModalService.openLabelsModal([this.latestDataset()], this.sessionData());
  }

  getDatasetLabels() {
    return getSortedLabels(this.latestDataset().labelIds, this.sessionData().labelsMap());
  }
}
