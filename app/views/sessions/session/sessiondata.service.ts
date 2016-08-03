import SessionResource from "../../../resources/session.resource";
import Utils from "../../../services/Utils";
import IRouteParamsService = angular.IRouteParamsService;
import ILogService = angular.ILogService;
import IWindowService = angular.IWindowService;
import ConfigService from "../../../services/ConfigService";
import AuthenticationService from "../../../authentication/authenticationservice";
import SessionEventService from "./sessionevent.service";

export default class SessionDataService {

    static $inject = ['$routeParams', 'SessionResource', '$log', '$window', 'ConfigService', 'AuthenticationService', 'SessionEventService'];

    sessionId: string;
    jobsMap = new Map();
    datasetsMap = new Map();
    modules: [any];
    tools: [any];
    modulesMap = new Map();
    sessionUrl: any;

    subscription: any;

    listeners: any[] = [];

    constructor(
        private $routeParams: IRouteParamsService,
        private SessionResource: SessionResource,
        private $log: ILogService,
        private $window: IWindowService,
        private ConfigService: ConfigService,
        private AuthenticationService: AuthenticationService,
        private SessionEventService: SessionEventService) {

        this.sessionId = $routeParams['sessionId'];

        // SessionRestangular is a restangular object with
        // configured baseUrl and
        // authorization header
        this.sessionUrl = SessionResource.service.one('sessions', this.sessionId);

        SessionResource.loadSession(this.sessionId).then(function (data) {

            let parsedData: any = SessionResource.parseSessionData(data);
            this.sessionId = parsedData.session.sessionId;
            this.jobsMap = parsedData.jobsMap;
            this.datasetsMap = parsedData.datasetsMap;
            this.modules = parsedData.modules;
            this.tools = parsedData.tools;
            this.modulesMap = parsedData.modulesMap;

            console.log('going to subscribe', parsedData);

            // start listening for remote changes
            // in theory we may miss an update between the loadSession() and this subscribe(), but
            // the safe way would be much more complicated:
            // - subscribe but put the updates in queue
            // - loadSession().then()
            // - apply the queued updates
            this.subscription = SessionEventService.subscribe(this.sessionId, this, function (event, oldValue, newValue) {
                angular.forEach(this.listeners, function(listener) {
                    listener(event, oldValue, newValue);
                });
            }.bind(this));
        }.bind(this));
    }

    onSessionChange(listener) {
        this.listeners.push(listener);
    }

    destroy() {
        this.subscription.unsubscribe();
    }

    getDatasetList() {
        return Utils.mapValues(this.datasetsMap);
    };

    getJob = function (jobId) {
        return this.jobsMap.get(jobId);
    };

/*
    $scope.getDataSets = function () {
        $scope.datalist = $scope.sessionUrl.all('datasets')
            .getList();
    };*/

    deleteJobs = function (jobs) {

        angular.forEach(jobs, function (job) {
            var url = this.sessionUrl.one('jobs').one(job.jobId);
            url.remove().then(function (res) {
                this.$log.debug(res);
            }.bind(this));
        }.bind(this));
    };

    deleteDatasets = function (datasets) {

        angular.forEach(datasets, function (dataset) {
            var datasetUrl = this.sessionUrl.one('datasets').one(dataset.datasetId);
            datasetUrl.remove().then(function (res) {
                this.$log.debug(res);
            }.bind(this));
        }.bind(this));
    };

    updateDataset = function (dataset) {
        var datasetUrl = this.sessionUrl.one('datasets').one(dataset.datasetId);
        return datasetUrl.customPUT(dataset);
    };


    updateSession = function () {
        this.sessionUrl.customPUT(this.session);
    };

    getDatasetUrl = function (dataset) {
        //TODO should we have separate read-only tokens for datasets?
        return URI(this.ConfigService.getFileBrokerUrl())
            .path('sessions/' + this.$routeParams.sessionId + '/datasets/' + dataset.datasetId)
            .addQuery('token', this.AuthenticationService.getToken()).toString();

    };

    exportDatasets = function (datasets) {
        angular.forEach(datasets, function (d) {
            this.$window.open(this.getDatasetUrl(d), "_blank")
        }.bind(this));
    };
}