
import SessionDataService from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import SessionResource from "../../../../shared/resources/session.resource";
import SelectionService from "../selection.service";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import * as _ from "lodash";
import {SessionData} from "../../../../model/session/session-data";
import SessionEventService from "../sessionevent.service";
import {Component, Inject, Input, Output} from "@angular/core";
import {EventEmitter} from "@angular/common/src/facade/async";


@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html'
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;
  private isCopying = false;
  datasetSearch: string;
  private selectedTab = 1;

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private sessionWorkerResource: SessionWorkerResource) {}

  ngOnInit() {
    this.sessionEventService.getSessionStream().subscribe(() => {
      // someone else has updated the session notes or the session name, show it
      // this.$scope.$apply();
    });
  }

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      var allDatasets = this.getDatasetList();


      // TODO - fix: commented out on angular2 upgrade
      // this.selectionService.setSelectedDatasets(IChipsterFilter['searchDatasetFilter'](allDatasets, this.datasetSearch));

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

  setTab(tab: number) {
    this.selectedTab = tab;
  }

  isTab(tab: number) {
    return this.selectedTab === tab;
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  openSessionEditModal() {
    var modalInstance = this.getSessionEditModal('Rename session', this.sessionData.session.name);

    modalInstance.result.then( (result: string) => {
      if (!result) {
        result = 'unnamed session';
      }
      this.sessionData.session.name = result;
      this.sessionDataService.updateSession(this.sessionData.session).subscribe();
    }, function () {
      // modal dismissed
    });
  }

  downloadSession(): void {
    this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).subscribe((url) => {
      this.sessionDataService.download(url);
    });
  }

  toggleDatasetSelection($event, data) {
    this.selectionService.toggleDatasetSelection($event, data, UtilsService.mapValues(this.sessionData.datasetsMap));
  }

  openAddDatasetModal() {
    this.$uibModal.open({
      animation: true,
      templateUrl: './adddatasetmodal/adddatasetmodal.html',
      controller: 'AddDatasetModalController',
      controllerAs: 'vm',
      bindToController: true,
      size: 'lg',
      resolve: {
        datasetsMap: () => {
          return new Map(this.sessionData.datasetsMap);
        },
        sessionId: () => {
          return this.sessionDataService.getSessionId();
        },
        oneFile: () => false,
        files: () => []
      }
    });
  }

  openCopySessionModal() {
    var modalInstance = this.getSessionEditModal('Copy session', this.sessionData.session.name + '_copy');


    modalInstance.result.then( (result: string) => {
      if (!result) {
        result = 'unnamed session';
      }
      this.isCopying = true;
      const sessionCopy$ = this.sessionResource.copySession(this.sessionData, result);
      sessionCopy$.subscribe(() => {
        this.isCopying = false;
      })
    }, function () {
      // modal dismissed
    });
  }

  getSessionEditModal(title: string, name: string) {
    return this.$uibModal.open({
      templateUrl: './sessioneditmodal/sessioneditmodal.html',
      controller: 'SessionEditModalController',
      controllerAs: 'vm',
      bindToController: true,
      resolve: {
        title: () => _.cloneDeep(title),
        name: () => _.cloneDeep(name)
      }
    });
  }
}
