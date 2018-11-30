import { SessionDataService } from "../session-data.service";
import { Dataset, Module } from "chipster-js-common";
import UtilsService from "../../../../shared/utilities/utils";
import { SessionData } from "../../../../model/session/session-data";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-session-panel",
  templateUrl: "./session-panel.component.html",
  styleUrls: ["./session-panel.component.less"]
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
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private restErrorService: RestErrorService
  ) {} // used by template

  search(value: any) {
    this.datasetSearch = value;
  }

  searchEnter() {
    // select highlighted datasets when the enter key is pressed
    const allDatasets = this.sessionDataService.getDatasetList(
      this.sessionData
    );
    this.selectionHandlerService.setDatasetSelection(
      this.datasetsearchPipe.transform(allDatasets, this.datasetSearch)
    );
    this.datasetSearch = null;
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if (UtilsService.isCtrlKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
      console.log([dataset]);
    } else if (UtilsService.isShiftKey($event)) {
      //  datasets and their ids in the order of the dataset list
      const allDatasets = this.sessionDataService.getDatasetListSortedByCreated(
        this.sessionData
      );
      const allIds = allDatasets.map(d => d.datasetId);

      // indexes of the old selection in the dataset list
      const selectedIndexes = this.selectionService.selectedDatasets.map(d =>
        allIds.indexOf(d.datasetId)
      );
      const clickIndex = allIds.indexOf(dataset.datasetId);
      const newMin = Math.min(clickIndex, ...selectedIndexes);
      const newMax = Math.max(clickIndex, ...selectedIndexes);

      // datasets within the index range
      const newSelection = _.range(newMin, newMax + 1).map(i => allDatasets[i]);
      this.selectionHandlerService.setDatasetSelection(newSelection);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
  }

  autoLayout() {
    const updates: Observable<any>[] = [];
    this.sessionData.datasetsMap.forEach(d => {
      if (d.x || d.y) {
        d.x = null;
        d.y = null;
        updates.push(this.sessionDataService.updateDataset(d));
      }
    });

    Observable.forkJoin(updates).subscribe(
      () => console.log(updates.length + " datasets updated"),
      err => this.restErrorService.handleError(err, "layout update failed")
    );
  }

  getCompleteDatasets() {
    return this.sessionDataService.getCompleteDatasets(this.sessionData);
  }

  getDatasetListSorted() {
    return this.sessionDataService.getDatasetListSortedByCreated(
      this.sessionData
    );
  }
}
