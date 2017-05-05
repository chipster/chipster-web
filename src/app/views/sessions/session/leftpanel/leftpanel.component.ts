
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionResource} from "../../../../shared/resources/session.resource";
import {SelectionService} from "../selection.service";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {StringModalService} from "../stringmodal/stringmodal.service";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";
import {Store} from "@ngrx/store";
import {Observable} from "rxjs";
import {SelectionHandlerService} from "../selection-handler.service";

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
    private sessionNameModalService: StringModalService,
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService) {}

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      var allDatasets = this.getDatasetList();
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

  downloadSession(): void {
    this.sessionDataService.download(
      this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()));
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if(UtilsService.isCtrlKey($event) || UtilsService.isShiftKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
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
