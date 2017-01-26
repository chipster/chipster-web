
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {SessionData} from "../../../model/session/session-data";
import * as _ from "lodash";
import WsEvent from "../../../model/events/wsevent";

class SessionComponent {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService', '$route'];

    toolDetailList: any = null;
    sessionData: SessionData;
    deletedDatasets: Array<Dataset>;
    deletedDatasetsTimeout: any;

    constructor(
        private $scope: ng.IScope,
        private $routeParams: ng.route.IRouteParamsService,
        private $window: ng.IWindowService,
        private $location: ng.ILocationService,
        private $filter: IChipsterFilter,
        private $log: ng.ILogService,
        private $uibModal: ng.ui.bootstrap.IModalService,
        private SessionEventService: SessionEventService,
        private sessionDataService: SessionDataService,
        private selectionService: SelectionService,
        private $route: ng.route.IRouteService) {
    }

    $onInit() {
      this.sessionData = this.$route.current.locals['sessionData'];

      // start listening for remote changes
      // in theory we may miss an update between the loadSession() and this subscribe(), but
      // the safe way would be much more complicated:
      // - subscribe but put the updates in queue
      // - loadSession().then()
      // - apply the queued updates

      this.SessionEventService.setSessionData(this.sessionDataService.getSessionId(), this.sessionData);

      this.SessionEventService.getAuthorizationStream().subscribe(change => {
        if (change.event.type === 'DELETE') {
          this.$scope.$apply(() => {
            alert('The session has been deleted.');
            this.$location.path('/sessions');
          });
        }
      });

      this.SessionEventService.getJobStream().subscribe(change => {

        let oldValue = <Job>change.oldValue;
        let newValue = <Job>change.newValue;

        // if not cancelled
        if (newValue) {
          // if the job has just failed
          if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
            this.openErrorModal('Job failed', newValue);
            this.$log.info(newValue);
          }
          if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
            this.openErrorModal('Job error', newValue);
            this.$log.info(newValue);
          }
        }
      });
    }

    $onDestroy() {
      this.SessionEventService.unsubscribe();
    }

    getSelectedDatasets() {
        return this.selectionService.selectedDatasets;
    }

    getSelectedJobs() {
        return this.selectionService.selectedJobs;
    }

    getJob(jobId: string): Job {
        return this.sessionData.jobsMap.get(jobId);
    }

    deleteJobs(jobs: Job[]) {
        this.sessionDataService.deleteJobs(jobs);
    }

    deleteDatasetsNow() {
        // cancel the timer
        clearTimeout(this.deletedDatasetsTimeout);

        // delete from the server
        this.sessionDataService.deleteDatasets(this.deletedDatasets);

        // hide the undo message
        this.deletedDatasets = null;
    }

    deleteDatasetsUndo() {
        // cancel the deletion
        clearTimeout(this.deletedDatasetsTimeout);

        // show datasets again in the workflowgraph
        this.deletedDatasets.forEach((dataset: Dataset) => {
            let wsEvent = new WsEvent(
              this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'CREATE');
            this.SessionEventService.generateLocalEvent(wsEvent);
        });

        // hide the undo message
        this.deletedDatasets = null;
    }

  /**
   * Poor man's undo for the dataset deletion.
   *
   * Hide the dataset from the client for ten
   * seconds and delete from the server only after that. deleteDatasetsUndo() will
   * cancel the timer and make the datasets visible again. Session copying and sharing
   * should filter out these hidden datasets or we need a proper server side support for this.
   */
  deleteDatasetsLater() {
        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);

        // hide from the workflowgraph
        this.deletedDatasets.forEach((dataset: Dataset) => {
          let wsEvent = new WsEvent(
            this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'DELETE');
          this.SessionEventService.generateLocalEvent(wsEvent);
        });

        // start timer to delete datasets from the server later
        this.deletedDatasetsTimeout = setTimeout(() => {
            this.deleteDatasetsNow();
        }, 10 * 1000);
    }

    renameDatasetDialog(dataset: Dataset) {
        this.sessionDataService.renameDatasetDialog(dataset);
    }

    exportDatasets(datasets: Dataset[]) {
        this.sessionDataService.exportDatasets(datasets);
    }

    getSession() {
        return this.sessionData.session;
    }

    getDatasetsMap() {
        return this.sessionData.datasetsMap;
    }

    getJobsMap() {
        return this.sessionData.jobsMap;
    }

    getModulesMap() {
        return this.sessionData.modulesMap;
    }

    getDatasetUrl() {
        if (this.selectionService.selectedDatasets && this.selectionService.selectedDatasets.length > 0) {
            return this.sessionDataService.getDatasetUrl(this.selectionService.selectedDatasets[0]);
        }
    }

    openErrorModal(title: string, job: Job) {
        this.$uibModal.open({
            animation: true,
            templateUrl: './joberrormodal/joberrormodal.html',
            controller: 'JobErrorModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                toolErrorTitle: () => {
                    return _.cloneDeep(title);
                },
                toolError: () => {
                    //TODO pass on the job and show only relevant fields
                    return _.cloneDeep(JSON.stringify(job, null, 2)); // 2 for pretty print
                }
            }
        });
    }
}


export default {
    controller: SessionComponent,
    templateUrl: './session.component.html'
}
