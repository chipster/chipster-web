
import SessionDataService from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../services/utils.service";
import SessionResource from "../../../../resources/session.resource";
import {SessionData} from "../../../../resources/session.resource";
import SelectionService from "../selection.service";
import SessionWorkerResource from "../../../../resources/sessionworker.resource";


class LeftPanelComponent {

  sessionData: SessionData;
  private isCopying = false;
  datasetSearch: string;
  private selectedTab = 1;

  static $inject = ['SessionResource', 'SessionDataService', '$uibModal', '$scope', 'SelectionService', 'SessionWorkerResource'];

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private $uibModal: ng.ui.bootstrap.IModalService,
    private $scope: ng.IScope,
    private selectionService: SelectionService,
    private sessionWorkerResource: SessionWorkerResource) {

    // We are only handling the resize end event, currently only
    // working in workflowgraph graph div
    this.$scope.$on("angular-resizable.resizeEnd", () => {
      this.$scope.$broadcast('resizeWorkFlowGraph', {});
    });
  }

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      var allDatasets = this.getDatasetList();
      this.selectionService.selectedDatasets = this.$filter('searchDatasetFilter')(allDatasets, this.datasetSearch);
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
      this.sessionDataService.updateSession(this.sessionData.session);
    }, function () {
      // modal dismissed
    });
  }

  downloadSession() {
    this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).then((url) => {
      this.sessionDataService.download(url);
    })
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
      this.sessionResource.copySession(this.sessionData, result).then(() => {
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

export default {
  controller: LeftPanelComponent,
  templateUrl: './leftpanel.component.html',
  bindings: {
    onDelete: '&',
    sessionData: '<'
  }
}

