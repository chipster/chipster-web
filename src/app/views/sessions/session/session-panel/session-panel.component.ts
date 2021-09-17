import { Component, Input } from "@angular/core";
import { Dataset, Module } from "chipster-js-common";
import * as _ from "lodash";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../model/session/session-data";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import UtilsService from "../../../../shared/utilities/utils";
import { GetSessionDataService } from "../get-session-data.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { SessionDataService } from "../session-data.service";
import { WorkflowGraphService } from "./workflow-graph/workflow-graph.service";

@Component({
  selector: "ch-session-panel",
  templateUrl: "./session-panel.component.html",
  styleUrls: ["./session-panel.component.less"],
})
export class SessionPanelComponent {
  @Input()
  sessionData: SessionData;
  @Input()
  modulesMap: Map<string, Module>;

  datasetSearch: string;

  // noinspection JSUnusedLocalSymbols
  constructor(
    public sessionDataService: SessionDataService, // used by template
    public getSessionDataService: GetSessionDataService,
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    public selectionService: SelectionService,
    private restErrorService: RestErrorService,
    private workflowGraphService: WorkflowGraphService
  ) {} // used by template

  search(value: any): void {
    this.datasetSearch = value;
  }

  searchEnter(): void {
    // select highlighted datasets when the enter key is pressed
    const allDatasets = this.sessionDataService.getDatasetList(this.sessionData);
    this.selectionHandlerService.setDatasetSelection(this.datasetsearchPipe.transform(allDatasets, this.datasetSearch));
    this.datasetSearch = null;
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if (UtilsService.isCtrlKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
    } else if (UtilsService.isShiftKey($event)) {
      //  datasets and their ids in the order of the dataset list
      const allDatasets = this.sessionDataService.getDatasetListSortedByCreated(this.sessionData);

      // only apply to those filtered by dataset search
      const searchDatasets = this.datasetsearchPipe.transform(allDatasets, this.datasetSearch);
      const searchIds = searchDatasets.map((d) => d.datasetId);

      // indexes of the old selection in the dataset list
      const selectedIndexes = this.selectionService.selectedDatasets.map((d) => searchIds.indexOf(d.datasetId));
      const clickIndex = searchIds.indexOf(dataset.datasetId);
      const newMin = Math.min(clickIndex, ...selectedIndexes);
      const newMax = Math.max(clickIndex, ...selectedIndexes);

      // datasets within the index range
      const newSelection = _.range(newMin, newMax + 1).map((i) => searchDatasets[i]);
      this.selectionHandlerService.setDatasetSelection(newSelection);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
  }

  autoLayoutAll(): void {
    const allDatasets = Array.from(this.sessionData.datasetsMap.values());
    this.workflowGraphService.resetDoAndSaveLayout(allDatasets, this.sessionData.datasetsMap, this.sessionData.jobsMap);
  }

  autoLayoutSelected(): void {
    this.workflowGraphService.resetDoAndSaveLayout(
      this.selectionService.selectedDatasets,
      this.sessionData.datasetsMap,
      this.sessionData.jobsMap
    );
  }

  selectChildren() {
    const children = this.getSessionDataService.getChildren(this.selectionService.selectedDatasets);
    this.selectionHandlerService.setDatasetSelection(children);
  }

  selectAll() {
    const all = this.sessionDataService.getCompleteDatasets(this.sessionData.datasetsMap);
    this.selectionHandlerService.setDatasetSelection(Array.from(all.values()));
  }

  getDatasetListSorted(): Dataset[] {
    return this.sessionDataService.getDatasetListSortedByCreated(this.sessionData);
  }

  isDatasetsSelected() {
    return this.selectionService.selectedDatasets.length > 0;
  }
}
