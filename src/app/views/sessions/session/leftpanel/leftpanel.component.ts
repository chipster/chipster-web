
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";
import {SelectionHandlerService} from "../selection-handler.service";
import {SelectionService} from "../selection.service";

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

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      let allDatasets = this.getDatasetList();
      this.selectionHandlerService.setDatasetSelection(this.datasetsearchPipe.transform(allDatasets, this.datasetSearch));
      this.datasetSearch = null;
    }
    if (e.keyCode == 27) { // escape key
      // clear the search
      this.datasetSearch = null;
    }
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created));
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if(UtilsService.isCtrlKey($event) || UtilsService.isShiftKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
  }
}
