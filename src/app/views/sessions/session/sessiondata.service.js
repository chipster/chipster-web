"use strict";
var dataset_1 = require("../../../model/session/dataset");
var job_1 = require("../../../model/session/job");
var utils_service_1 = require("../../../services/utils.service");
var jobinput_1 = require("../../../model/session/jobinput");
var SessionDataService = (function () {
    function SessionDataService($routeParams, sessionResource, $log, $window, configService, authenticationService, $uibModal, selectionService, fileResource) {
        this.$routeParams = $routeParams;
        this.sessionResource = sessionResource;
        this.$log = $log;
        this.$window = $window;
        this.configService = configService;
        this.authenticationService = authenticationService;
        this.$uibModal = $uibModal;
        this.selectionService = selectionService;
        this.fileResource = fileResource;
        this.listeners = [];
    }
    // start listening for remote changes
    // in theory we may miss an update between the loadSession() and this subscribe(), but
    // the safe way would be much more complicated:
    // - subscribe but put the updates in queue
    // - loadSession().then()
    // - apply the queued updates
    // SessionRestangular is a restangular object with
    // configured baseUrl and
    // authorization header
    //this.sessionUrl = this.SessionResource.service.one('sessions', this.$routeParams['sessionId'];);
    SessionDataService.prototype.getSessionId = function () {
        return this.$routeParams['sessionId'];
    };
    SessionDataService.prototype.onSessionChange = function (listener) {
        this.listeners.push(listener);
    };
    SessionDataService.prototype.destroy = function () {
        this.subscription.then(function (subscription) {
            subscription.unsubscribe();
        });
    };
    SessionDataService.prototype.createDataset = function (dataset) {
        return this.sessionResource.createDataset(this.getSessionId(), dataset);
    };
    SessionDataService.prototype.createJob = function (job) {
        return this.sessionResource.createJob(this.getSessionId(), job);
    };
    SessionDataService.prototype.getJobById = function (jobId, jobs) {
        return jobs.get(jobId);
    };
    /**
     * Create a dataset which is derived from some other datasets.
     *
     * The file content is uploaded to the server and a fake job is created, so
     * that the datasets' relationships are shown correctly in the workflowgraph graph.
     *
     * @param name Name of the new dataset
     * @param sourceDatasetIds Array of datasetIds shown as inputs for the new dataset
     * @param toolName e.g. name of the visualization that created this dataset
     * @param content File content, the actual data
     * @returns Promise which resolves when all this is done
     */
    SessionDataService.prototype.createDerivedDataset = function (name, sourceDatasetIds, toolName, content) {
        var _this = this;
        var d = new dataset_1.default(name);
        return this.createDataset(d).then(function (datasetId) {
            d.datasetId = datasetId;
            var job = new job_1.default();
            job.state = "COMPLETED";
            job.toolCategory = "Interactive visualizations";
            job.toolName = toolName;
            job.inputs = sourceDatasetIds.map(function (id) {
                var input = new jobinput_1.default();
                input.datasetId = id;
                return input;
            });
            return _this.createJob(job);
        }).then(function (jobId) {
            // d.datasetId is already set above
            d.sourceJob = jobId;
            return _this.updateDataset(d);
        }).then(function () {
            return _this.fileResource.uploadData(_this.getSessionId(), d.datasetId, content);
        });
    };
    SessionDataService.prototype.deleteJobs = function (jobs) {
        var _this = this;
        for (var _i = 0, jobs_1 = jobs; _i < jobs_1.length; _i++) {
            var job = jobs_1[_i];
            this.sessionResource.deleteJob(this.getSessionId(), job.jobId).then(function (res) {
                _this.$log.debug('job deleted', res);
            });
        }
    };
    SessionDataService.prototype.deleteDatasets = function (datasets) {
        var _this = this;
        for (var _i = 0, datasets_1 = datasets; _i < datasets_1.length; _i++) {
            var dataset = datasets_1[_i];
            this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId).then(function (res) {
                _this.$log.debug('dataset deleted', res);
            });
        }
    };
    SessionDataService.prototype.updateDataset = function (dataset) {
        return this.sessionResource.updateDataset(this.getSessionId(), dataset);
    };
    SessionDataService.prototype.getDatasetList = function (datasetsMap) {
        return utils_service_1.default.mapValues(datasetsMap);
    };
    SessionDataService.prototype.updateSession = function (session) {
        return this.sessionResource.updateSession(session);
    };
    SessionDataService.prototype.getDatasetUrl = function (dataset) {
        //TODO should we have separate read-only tokens for datasets?
        /*
        getFileBrokerUrl() is really an async call, but let's hope some one else has initialized it already
        because the URL is used in many different places and the async result could be difficult for some
        of them.
         */
        return URI(this.configService.getFileBrokerUrlIfInitialized())
            .path('sessions/' + this.getSessionId() + '/datasets/' + dataset.datasetId)
            .addSearch('token', this.authenticationService.getToken()).toString();
    };
    SessionDataService.prototype.exportDatasets = function (datasets) {
        for (var _i = 0, datasets_2 = datasets; _i < datasets_2.length; _i++) {
            var d = datasets_2[_i];
            this.download(this.getDatasetUrl(d));
        }
    };
    SessionDataService.prototype.download = function (url) {
        this.$window.open(url, "_blank");
    };
    SessionDataService.prototype.renameDatasetDialog = function (dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        this.updateDataset(dataset);
    };
    SessionDataService.prototype.openDatasetHistoryModal = function () {
        this.$uibModal.open({
            templateUrl: 'app/views/sessions/session/datasethistorymodal/datasethistorymodal.html',
            controller: 'DatasetHistoryModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                selectedDatasets: function () {
                    return angular.copy(this.selectionService.selectedDatasets);
                }.bind(this)
            }
        });
    };
    ;
    return SessionDataService;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SessionDataService;
SessionDataService.$inject = [
    '$routeParams', 'SessionWorkerResource', '$log', '$window', 'ConfigService', 'AuthenticationService',
    '$uibModal', 'SelectionService', 'FileResource'
];
//# sourceMappingURL=sessiondata.service.js.map
