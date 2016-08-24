import SessionResource from "../../../resources/session.resource";
import Utils from "../../../services/utils.service";
import ILogService = angular.ILogService;
import IWindowService = angular.IWindowService;
import ConfigService from "../../../services/config.service";
import AuthenticationService from "../../../authentication/authenticationservice";
import Session from "../../../model/session/session";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import Module from "../../../model/session/module";
import Tool from "../../../model/session/tool";
import {SessionData} from "../../../resources/session.resource";
import IModalService = angular.ui.bootstrap.IModalService;

export default class SessionDataService {

    static $inject = [
        '$routeParams', 'SessionResource', '$log', '$window', 'ConfigService', 'AuthenticationService',
         '$uibModal'];

    constructor(
        private $routeParams: ng.route.IRouteParamsService,
        private SessionResource: SessionResource,
        private $log: ILogService,
        private $window: IWindowService,
        private ConfigService: ConfigService,
        private AuthenticationService: AuthenticationService,
        private $uibModal: IModalService) {

        this.init();
    }

    sessionId: string;
    jobsMap = new Map<string, Job>();
    datasetsMap = new Map<string, Dataset>();
    modules: Module[];
    tools: Tool[];
    modulesMap = new Map<string, Module>();
    subscription: {unsubscribe(): void};
    session: Session;
    listeners: any = [];

    init() {
        this.sessionId = this.$routeParams['sessionId'];
        // start listening for remote changes
        // in theory we may miss an update between the loadSession() and this subscribe(), but
        // the safe way would be much more complicated:
        // - subscribe but put the updates in queue
        // - loadSession().then()
        // - apply the queued updates

        // SessionRestangular is a restangular object with
        // configured baseUrl and
        // authorization header
        //this.sessionUrl = this.SessionResource.service.one('sessions', this.sessionId);


    }

    onSessionChange(listener: any) {
        this.listeners.push(listener);
    }

    destroy() {
        this.subscription.unsubscribe();
    }

    getDatasetList(): Dataset[] {
        return Utils.mapValues(this.datasetsMap);
    }

    getJob(jobId: string): Job {
        return this.jobsMap.get(jobId);
    }

    createDataset(dataset: Dataset) {
        return this.SessionResource.createDataset(this.sessionId, dataset);
    }

    createJob(job: Job) {
        return this.SessionResource.createJob(this.sessionId, job).then((res: any) => {
            this.$log.debug('job created', res);
        });
    }

    deleteJobs(jobs: Job[]) {
        for (let job of jobs) {
            this.SessionResource.deleteJob(this.sessionId, job.jobId).then(function (res: any) {
                this.$log.debug('job deleted', res);
            }.bind(this));
        }
    }

    deleteDatasets(datasets: Dataset[]) {

        for (let dataset of datasets) {
            this.SessionResource.deleteDataset(this.sessionId, dataset.datasetId).then(function (res: any) {
                this.$log.debug('dataset deleted', res);
            }.bind(this));
        }
    }

    updateDataset(dataset: Dataset) {
        return this.SessionResource.updateDataset(this.sessionId, dataset);
    }


    updateSession() {
        return this.SessionResource.updateSession(this.session);
    }

    getDatasetUrl(dataset: Dataset): string {
        //TODO should we have separate read-only tokens for datasets?
        /*
        getFileBrokerUrl() is really an async call, but let's hope some one else has initialized it already
        because the URL is used in many different places and the async result could be difficult for some
        of them.
         */

        return URI(this.ConfigService.getFileBrokerUrlIfInitialized())
            .path('sessions/' + this.sessionId + '/datasets/' + dataset.datasetId)
            .addSearch('token', this.AuthenticationService.getToken()).toString();

    }

    exportDatasets(datasets: Dataset[]) {
        for (let d of datasets) {
            this.$window.open(this.getDatasetUrl(d), "_blank")
        }
    }

    renameDatasetDialog(dataset: Dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        this.updateDataset(dataset);
    }

    openDatasetHistoryModal() {
        this.$uibModal.open({
            templateUrl: 'views/sessions/session/datasethistorymodal/datasethistorymodal.html',
            controller: 'DatasetHistoryModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                selectedDatasets: function () {
                    return angular.copy(this.SelectionService.selectedDatasets);
                }.bind(this)
            }
        })
    };
}