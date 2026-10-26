import { Component, OnChanges, SimpleChanges, computed, inject, input, output } from "@angular/core";
import { Dataset, Job, Module, Tool } from "chipster-js-common";
import { clone } from "lodash-es";
import { mergeMap } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetContextMenuService } from "../../dataset.cotext.menu.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { LabelMenuItem, LabelsContextMenuService } from "../../labels/labels-context-menu.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { DatasetModalService } from "../datasetmodal.service";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";
import { LabelMenuItemContentComponent } from "../../labels/label-menu-item-content.component";
import { VisualizationsComponent } from "../../visualization/visualizations.component";

@Component({
  selector: "ch-selected-files",
  templateUrl: "./selected-files.component.html",
  styleUrls: ["./selected-files.component.less"],
  imports: [NGB_DROPDOWN_IMPORTS, LabelMenuItemContentComponent, VisualizationsComponent],
})
export class FileComponent implements OnChanges {
  selectionService = inject(SelectionService);
  private sessionDataService = inject(SessionDataService);
  private datasetModalService = inject(DatasetModalService);
  private dialogModalService = inject(DialogModalService);
  private restErrorService = inject(RestErrorService);
  private getSessionDataService = inject(GetSessionDataService);
  private selectionHandlerService = inject(SelectionHandlerService);
  private datasetContextMenuService = inject(DatasetContextMenuService);
  private labelsContextMenuService = inject(LabelsContextMenuService);

  readonly dataset = input<Dataset>(undefined);
  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);
  readonly modules = input<Module[]>(undefined);

  readonly doScrollFix = output<void>();

  // the latest copy in datasetsMap, so that a rename shows
  readonly datasetName = computed(
    () => this.sessionData().datasetsMap().get(this.dataset().datasetId)?.name ?? this.dataset().name,
  );

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
    this.sourceJob = this.datasetContextMenuService.getSourceJob([this.dataset()], this.sessionData().jobsMap());
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
}
