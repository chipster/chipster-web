import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
} from "@angular/core";
import { Dataset, Job, Module, Tool } from "chipster-js-common";
import { clone } from "lodash-es";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetContextMenuService } from "../../dataset.cotext.menu.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { LabelMenuItem, LabelsContextMenuService } from "../../labels/labels-context-menu.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { DatasetModalService } from "../datasetmodal.service";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";
import { LabelMenuItemContentComponent } from "../../labels/label-menu-item-content.component";
import { VisualizationsComponent } from "../../visualization/visualizations.component";

@Component({
  selector: "ch-selected-files",
  templateUrl: "./selected-files.component.html",
  styleUrls: ["./selected-files.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NGB_DROPDOWN_IMPORTS, LabelMenuItemContentComponent, VisualizationsComponent],
})
export class FileComponent implements OnInit, OnChanges, OnDestroy {
  selectionService = inject(SelectionService);
  private sessionDataService = inject(SessionDataService);
  private datasetModalService = inject(DatasetModalService);
  private dialogModalService = inject(DialogModalService);
  private restErrorService = inject(RestErrorService);
  private sessionEventService = inject(SessionEventService);
  private getSessionDataService = inject(GetSessionDataService);
  private selectionHandlerService = inject(SelectionHandlerService);
  private datasetContextMenuService = inject(DatasetContextMenuService);
  private labelsContextMenuService = inject(LabelsContextMenuService);

  readonly dataset = input<Dataset>(undefined);
  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);
  readonly modules = input<Module[]>(undefined);

  readonly doScrollFix = output<void>();

  datasetName: string;

  private unsubscribe: Subject<any> = new Subject();
  sourceJob: Job;
  modulesMap: Map<string, Module>;
  labelsSubmenuOpen = false;

  get labelMenuItems(): LabelMenuItem[] {
    return this.labelsContextMenuService.buildItems(this.selectionService.selectedDatasets, this.sessionData());
  }

  toggleLabel(item: LabelMenuItem): void {
    this.labelsContextMenuService
      .toggleLabel(this.selectionService.selectedDatasets, item.label, this.sessionData())
      .subscribe();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.datasetName = this.dataset().name;

    this.sourceJob = this.datasetContextMenuService.getSourceJob([this.dataset()], this.sessionData().jobsMap);
  }

  ngOnInit(): void {
    // subscribe to selected dataset content changes, needed for getting new file name after Rename
    this.sessionEventService
      .getSelectedDatasetsContentsUpdatedStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (datasetId) => {
          const dataset = this.dataset();
          if (datasetId === dataset?.datasetId) {
            this.datasetName = this.sessionData().datasetsMap.get(dataset.datasetId)?.name;
          }
        },
      });
  }

  renameDataset() {
    const dataset = clone(this.dataset());
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
    this.sessionDataService.exportDatasets([this.dataset()]);
  }

  showHistory() {
    this.datasetModalService.openDatasetHistoryModal(this.dataset(), this.sessionData(), this.tools());
  }

  wrangleDataset() {
    this.datasetModalService.openWrangleModal(this.dataset(), this.sessionData());
  }

  defineDatasetGroups() {
    this.datasetModalService.openGroupsModal(this.selectionService.selectedDatasets, this.sessionData());
  }

  copyToNewSession() {
    this.datasetModalService.openCopySelectionToNewSessionModal(
      this.selectionService.selectedDatasets,
      this.sessionData(),
    );
  }

  copyToExistingSession() {
    this.datasetModalService.openCopySelectionToExistingSessionModal(
      this.selectionService.selectedDatasets,
      this.sessionData(),
    );
  }

  showJob() {
    this.datasetContextMenuService.showJob(this.sourceJob, this.tools(), this.sessionData());
  }

  selectToolAndParameters() {}

  manageLabels() {
    this.datasetModalService.openLabelsModal(this.selectionService.selectedDatasets, this.sessionData());
  }

  selectChildren() {
    const children = this.getSessionDataService.getChildren(this.selectionService.selectedDatasets);
    this.selectionHandlerService.setDatasetSelection(children);
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
