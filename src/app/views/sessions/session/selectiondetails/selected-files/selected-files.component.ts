import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { Dataset, Job, Module, Tool } from "chipster-js-common";
import { clone } from "lodash-es";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetContextMenuService } from "../../dataset.cotext.menu.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { DatasetModalService } from "../datasetmodal.service";

@Component({
  selector: "ch-selected-files",
  templateUrl: "./selected-files.component.html",
  styleUrls: ["./selected-files.component.less"],
})
export class FileComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];
  @Input()
  modules: Module[];

  @Output() doScrollFix = new EventEmitter();

  datasetName: string;

  private unsubscribe: Subject<any> = new Subject();
  sourceJob: Job;
  modulesMap: Map<string, Module>;

  constructor(
    public selectionService: SelectionService, // used in template
    private sessionDataService: SessionDataService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionEventService: SessionEventService,
    private getSessionDataService: GetSessionDataService,
    private selectionHandlerService: SelectionHandlerService,
    private datasetContextMenuService: DatasetContextMenuService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.datasetName = this.dataset.name;

    this.sourceJob = this.datasetContextMenuService.getSourceJob([this.dataset], this.sessionData.jobsMap);
  }

  ngOnInit(): void {
    // subscribe to selected dataset content changes, needed for getting new file name after Rename
    this.sessionEventService
      .getSelectedDatasetsContentsUpdatedStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (datasetId) => {
          if (datasetId === this.dataset?.datasetId) {
            this.datasetName = this.sessionData.datasetsMap.get(this.dataset.datasetId)?.name;
          }
        },
      });
  }

  renameDataset() {
    const dataset = clone(this.dataset);
    this.dialogModalService
      .openStringModal("Rename file", "File name", dataset.name, "Rename")
      .pipe(
        mergeMap((name) => {
          dataset.name = name;
          return this.sessionDataService.updateDataset(dataset);
        }),
      )
      .subscribe({
        error: (err) => this.restErrorService.showError("Rename file failed", err),
      });
  }

  deleteDatasets() {
    this.sessionDataService.openDeleteFilesConfirm(this.selectionService.selectedDatasets);
  }

  exportDatasets() {
    this.sessionDataService.exportDatasets([this.dataset]);
  }

  showHistory() {
    this.datasetModalService.openDatasetHistoryModal(this.dataset, this.sessionData, this.tools);
  }

  wrangleDataset() {
    this.datasetModalService.openWrangleModal(this.dataset, this.sessionData);
  }

  defineDatasetGroups() {
    this.datasetModalService.openGroupsModal(this.selectionService.selectedDatasets, this.sessionData);
  }

  copyToSession() {
    this.datasetModalService.openCopyToNewSessionModal(this.selectionService.selectedDatasets, this.sessionData);
  }

  showJob() {
    this.datasetContextMenuService.showJob(this.sourceJob, this.tools, this.sessionData);
  }

  selectToolAndParameters() {}

  selectChildren() {
    const children = this.getSessionDataService.getChildren(this.selectionService.selectedDatasets);
    this.selectionHandlerService.setDatasetSelection(children);
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
