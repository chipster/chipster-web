
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";
import {SelectionHandlerService} from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import _ = require("lodash");

@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html',
  styleUrls: ['./leftpanel.component.less'],
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;

  datasetSearch: string;

  // noinspection JSUnusedLocalSymbols
  constructor(
    private sessionDataService: SessionDataService, // used by template
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService) {} // used by template

  search(value: any) {
    this.datasetSearch = value;
  }

  searchEnter() {
    // select highlighted datasets when the enter key is pressed
    const allDatasets = this.getDatasetList();
    this.selectionHandlerService.setDatasetSelection(this.datasetsearchPipe.transform(allDatasets, this.datasetSearch));
    this.datasetSearch = null;
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created));
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if (UtilsService.isCtrlKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
      console.log([dataset]);

    } else if (UtilsService.isShiftKey($event)) {

      //  datasets and their ids in the order of the dataset list
      const allDatasets = this.getDatasetListSorted();
      const allIds = allDatasets.map(d => d.datasetId);

      // indexes of the old selection in the dataset list
      const selectedIndexes = this.selectionService.selectedDatasets.map(d => allIds.indexOf(d.datasetId));
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
}
