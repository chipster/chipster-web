
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionResource} from "../../../../shared/resources/session.resource";
import {SelectionService} from "../selection.service";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {SessionNameModalService} from "./sessionnamemodal/sessionnamemodal.service";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";

@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html'
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;
  private isCopying = false;
  datasetSearch: string;

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private selectionService: SelectionService,
    private sessionWorkerResource: SessionWorkerResource,
    private sessionNameModalService: SessionNameModalService,
    private datasetsearchPipe: DatasetsearchPipe) {}

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      var allDatasets = this.getDatasetList();

      this.selectionService.setSelectedDatasets(this.datasetsearchPipe.transform(allDatasets, this.datasetSearch));

      this.datasetSearch = null;
    }
    if (e.keyCode == 27) { // escape key
      // clear the search
      this.datasetSearch = null;
    }
  }

  isSelectedDataset(dataset: Dataset) {
    return this.selectionService.isSelectedDataset(dataset);
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  downloadSession(): void {
    this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).subscribe((url) => {
      this.sessionDataService.download(url);
    });
  }

  toggleDatasetSelection($event, data) {
    this.selectionService.toggleDatasetSelection($event, data, UtilsService.mapValues(this.sessionData.datasetsMap));
  }

  renameSessionModal() {
    this.sessionNameModalService.openSessionNameModal('Rename session', this.sessionData.session.name).then(name => {
      console.log('renameSessionModal', name);
      this.sessionData.session.name = name;
      this.sessionDataService.updateSession(this.sessionData.session).subscribe();
    }, () => {
      // modal dismissed
    });
  }

  openCopySessionModal() {
    this.sessionNameModalService.openSessionNameModal('Copy session', this.sessionData.session.name + '_copy').then(name => {
      console.log('openCopySessionModal()', name);
      if (!name) {
        name = 'unnamed session';
      }
      this.isCopying = true;
      this.sessionResource.copySession(this.sessionData, name).subscribe(() => {
        console.log('copy done');
        this.isCopying = false;
      });
    }, () => {
      // modal dismissed
    });
  }
}
