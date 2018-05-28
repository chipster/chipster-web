import { SessionDataService } from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import { SessionData } from "../../../../model/session/session-data";
import { Component, Input } from "@angular/core";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import * as _ from "lodash";

@Component({
  selector: "ch-session-panel",
  templateUrl: "./session-panel.component.html",
  styleUrls: ["./session-panel.component.less"]
})
export class SessionPanelComponent {
  @Input() sessionData: SessionData;

  datasetSearch: string;

  // noinspection JSUnusedLocalSymbols
  constructor(
    private sessionDataService: SessionDataService, // used by template
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService
  ) {} // used by template

  search(value: any) {
    this.datasetSearch = value;
  }

  searchEnter() {
    // select highlighted datasets when the enter key is pressed
    const allDatasets = this.getDatasetList();
    this.selectionHandlerService.setDatasetSelection(
      this.datasetsearchPipe.transform(allDatasets, this.datasetSearch)
    );
    this.datasetSearch = null;
  }

  getCompleteDatasets() {
    /*
    Filter out uploading datasets

    Datasets are created when comp starts to upload them, but there are no type tags until the
    upload is finished. Hide these uploading datasets from the workflow, file list and dataset search.
    When those cannot be selected, those cannot cause problems in the visualization, which assumes that
    the type tags are do exist.
    */
    // convert to array[[key1, value1], [key2, value2], ...] for filtering and back to map
    return new Map(
      Array.from(this.sessionData.datasetsMap).filter(entry => {
        const dataset = entry[1];
        return dataset.fileId != null;
      })
    );
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.getCompleteDatasets());
  }

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) =>
      UtilsService.compareStringNullSafe(a.created, b.created)
    );
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
}
