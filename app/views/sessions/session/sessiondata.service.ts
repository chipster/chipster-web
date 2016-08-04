import SessionResource from "../../../resources/session.resource";
import Utils from "../../../services/Utils";
import IRouteParamsService = angular.IRouteParamsService;
import ILogService = angular.ILogService;
import IWindowService = angular.IWindowService;
import IUibModalService = angular.IUibModalService;
import ConfigService from "../../../services/ConfigService";
import AuthenticationService from "../../../authentication/authenticationservice";
import SessionEventService from "./sessionevent.service";
import Session from "./model/session";
import Dataset from "./model/dataset";
import Job from "./model/job";
import Module from "./model/module";
import Tool from "./model/tool";

export default class SessionDataService {

    static $inject = [
        '$routeParams', 'SessionResource', '$log', '$window', 'ConfigService', 'AuthenticationService',
        'SessionEventService', '$uibModal'];

    constructor(
        private $routeParams: IRouteParamsService,
        private SessionResource: SessionResource,
        private $log: ILogService,
        private $window: IWindowService,
        private ConfigService: ConfigService,
        private AuthenticationService: AuthenticationService,
        private SessionEventService: SessionEventService,
        private $uibModal: IUibModalService) {

        this.init();
    }

    sessionId: string;
    jobsMap = new Map<string, Job>();
    datasetsMap = new Map<string, Dataset>();
    modules: Module[];
    tools: Tool[];
    modulesMap = new Map<string, Module>();
    sessionUrl: any;
    subscription: {unsubscribe(): void};
    session: Session;
    listeners: any = [];

    init() {
        this.sessionId = this.$routeParams['sessionId'];

        // SessionRestangular is a restangular object with
        // configured baseUrl and
        // authorization header
        this.sessionUrl = this.SessionResource.service.one('sessions', this.sessionId);

        this.SessionResource.loadSession(this.sessionId).then(function (data: any) {


            let parsedData: any = this.SessionResource.parseSessionData(data);
            this.sessionId = parsedData.session.sessionId;
            this.jobsMap = parsedData.jobsMap;
            this.datasetsMap = parsedData.datasetsMap;
            this.modules = parsedData.modules;
            this.tools = parsedData.tools;
            this.modulesMap = parsedData.modulesMap;
            this.session = parsedData.session;

            // start listening for remote changes
            // in theory we may miss an update between the loadSession() and this subscribe(), but
            // the safe way would be much more complicated:
            // - subscribe but put the updates in queue
            // - loadSession().then()
            // - apply the queued updates
            this.subscription = this.SessionEventService.subscribe(this.sessionId, this, function (event: any, oldValue: any, newValue: any) {
                for (let listener of this.listeners) {
                    listener(event, oldValue, newValue);
                }
            }.bind(this));
        }.bind(this));
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

    deleteJobs(jobs: Job[]) {
        for (let job of jobs) {
            var url = this.sessionUrl.one('jobs').one(job.jobId);
            url.remove().then(function (res: any) {
                this.$log.debug(res);
            }.bind(this));
        }
    }

    deleteDatasets(datasets: Dataset[]) {

        for (let dataset of datasets) {
            var datasetUrl = this.sessionUrl.one('datasets').one(dataset.datasetId);
            datasetUrl.remove().then(function (res: any) {
                this.$log.debug(res);
            }.bind(this));
        }
    }

    updateDataset(dataset: Dataset) {
        var datasetUrl = this.sessionUrl.one('datasets').one(dataset.datasetId);
        return datasetUrl.customPUT(dataset);
    }


    updateSession() {
        this.sessionUrl.customPUT(this.session);
    }

    getDatasetUrl(dataset: Dataset): string {
        //TODO should we have separate read-only tokens for datasets?
        return URI(this.ConfigService.getFileBrokerUrl())
            .path('sessions/' + this.sessionId + '/datasets/' + dataset.datasetId)
            .addQuery('token', this.AuthenticationService.getToken()).toString();

    }

    exportDatasets(datasets: Dataset[]) {
        for (let d of datasets) {
            this.$window.open(this.getDatasetUrl(d), "_blank")
        }
    }

    renameDatasetDialog(dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        this.updateDataset(dataset);
    }

    openDatasetHistoryModal() {
        this.$uibModal.open({
            templateUrl: 'app/views/sessions/session/datasethistorymodal/datasethistorymodal.html',
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