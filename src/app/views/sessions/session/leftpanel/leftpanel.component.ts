
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionResource} from "../../../../shared/resources/session.resource";
import {SelectionService} from "../selection.service";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {DialogModalService} from "../dialogmodal/dialogmodal.service";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";
import {Store} from "@ngrx/store";
import {SelectionHandlerService} from "../selection-handler.service";
import {UrlTree, ActivatedRoute, Router} from "@angular/router";
import copy from 'copy-to-clipboard';


@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html',
  styleUrls: ['./leftpanel.component.less'],
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;
  private isCopying = false;
  datasetSearch: string;

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private router: Router,
    private route: ActivatedRoute,
    private sessionWorkerResource: SessionWorkerResource,
    private sessionNameModalService: DialogModalService,
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private store: Store<any>) {}

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

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) => a.created.localeCompare(b.created));
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

  saveCurrentUrlState() {
    // copy current route and selected datasetids as queryparameters to clippath
    this.store.select('selectedDatasets').subscribe( (datasets: Array<Dataset>) => {
      const datasetIds = datasets.map( (dataset: Dataset) => dataset.datasetId);
      const navigationExtras = { queryParams: { id: datasetIds } };
      const sessionId = this.route.snapshot.params['sessionId'];
      const urlTree: UrlTree = this.router.createUrlTree( ['sessions', sessionId], navigationExtras );
      if(datasetIds.length > 0) {
        copy(`${window.location.host}${urlTree.toString()}`);
      }
    }).unsubscribe();
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
