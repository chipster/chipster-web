"use strict";
var utils_service_1 = require("../../../services/utils.service");
var _ = require("lodash");
var SessionComponent = (function () {
    function SessionComponent($scope, $routeParams, $window, $location, $filter, $log, $uibModal, SessionEventService, sessionDataService, selectionService, $route, sessionResource, sessionWorkerResource) {
        this.$scope = $scope;
        this.$routeParams = $routeParams;
        this.$window = $window;
        this.$location = $location;
        this.$filter = $filter;
        this.$log = $log;
        this.$uibModal = $uibModal;
        this.SessionEventService = SessionEventService;
        this.sessionDataService = sessionDataService;
        this.selectionService = selectionService;
        this.$route = $route;
        this.sessionResource = sessionResource;
        this.sessionWorkerResource = sessionWorkerResource;
        this.selectedTab = 1;
        this.toolDetailList = null;
        this.isCopying = false;
    }
    SessionComponent.prototype.$onInit = function () {
        var _this = this;
        this.sessionData = this.$route.current.locals.sessionData;
        this.sessionDataService.onSessionChange(function (event, oldValue, newValue) {
            if (event.resourceType === 'SESSION' && event.type === 'DELETE') {
                _this.$scope.$apply(function () {
                    alert('The session has been deleted.');
                    this.$location.path('sessions');
                });
            }
            if (event.resourceType === 'DATASET') {
                _this.$scope.$broadcast('datasetsMapChanged', {});
            }
            if (event.resourceType === 'JOB') {
                _this.$scope.$broadcast('jobsMapChanged', {});
                // if not cancelled
                if (newValue) {
                    // if the job has just failed
                    if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
                        _this.openErrorModal('Job failed', newValue);
                        _this.$log.info(newValue);
                    }
                    if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
                        _this.openErrorModal('Job error', newValue);
                        _this.$log.info(newValue);
                    }
                }
            }
        });
        // We are only handling the resize end event, currently only
        // working in workflowgraph graph div
        this.$scope.$on("angular-resizable.resizeEnd", function () {
            _this.$scope.$broadcast('resizeWorkFlowGraph', {});
        });
        /*
         angular.element(this.$window).bind('resize', function () {
         this.$scope.$broadcast('resizeWorkFlowGraph', {});
         });*/
        this.sessionDataService.subscription = this.SessionEventService.subscribe(this.sessionDataService.getSessionId(), this.sessionData, function (event, oldValue, newValue) {
            for (var _i = 0, _a = _this.sessionDataService.listeners; _i < _a.length; _i++) {
                var listener = _a[_i];
                listener(event, oldValue, newValue);
            }
        });
    };
    SessionComponent.prototype.$onDestroy = function () {
        // stop listening for events when leaving this view
        this.sessionDataService.destroy();
    };
    SessionComponent.prototype.datasetSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            // select highlighted datasets
            var allDatasets = this.getDatasetList();
            this.selectionService.selectedDatasets = this.$filter('searchDatasetFilter')(allDatasets, this.datasetSearch);
            this.datasetSearch = null;
        }
        if (e.keyCode == 27) {
            // clear the search
            this.datasetSearch = null;
        }
    };
    SessionComponent.prototype.getSelectedDatasets = function () {
        return this.selectionService.selectedDatasets;
    };
    SessionComponent.prototype.getSelectedJobs = function () {
        return this.selectionService.selectedJobs;
    };
    SessionComponent.prototype.isSelectedDataset = function (dataset) {
        return this.selectionService.isSelectedDataset(dataset);
    };
    SessionComponent.prototype.setTab = function (tab) {
        this.selectedTab = tab;
    };
    SessionComponent.prototype.isTab = function (tab) {
        return this.selectedTab === tab;
    };
    SessionComponent.prototype.getJob = function (jobId) {
        return this.sessionData.jobsMap.get(jobId);
    };
    SessionComponent.prototype.deleteJobs = function (jobs) {
        this.sessionDataService.deleteJobs(jobs);
    };
    SessionComponent.prototype.deleteDatasetsNow = function () {
        // cancel the timer
        clearTimeout(this.deletedDatasetsTimeout);
        // delete from the server
        this.sessionDataService.deleteDatasets(this.deletedDatasets);
        // hide the undo message
        this.deletedDatasets = null;
    };
    SessionComponent.prototype.deleteDatasetsUndo = function () {
        var _this = this;
        // cancel the deletion
        clearTimeout(this.deletedDatasetsTimeout);
        // show datasets again in the workflowgraph
        this.deletedDatasets.forEach(function (dataset) {
            _this.sessionData.datasetsMap.set(dataset.datasetId, dataset);
        });
        // hide the undo message
        this.deletedDatasets = null;
    };
    SessionComponent.prototype.deleteDatasetsLater = function () {
        var _this = this;
        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);
        // hide from the workflowgraph
        this.deletedDatasets.forEach(function (dataset) {
            _this.sessionData.datasetsMap.delete(dataset.datasetId);
        });
        // start timer to delete datasets from the server later
        this.deletedDatasetsTimeout = setTimeout(function () {
            _this.deleteDatasetsNow();
        }, 10 * 1000);
    };
    SessionComponent.prototype.renameDatasetDialog = function (dataset) {
        this.sessionDataService.renameDatasetDialog(dataset);
    };
    SessionComponent.prototype.exportDatasets = function (datasets) {
        this.sessionDataService.exportDatasets(datasets);
    };
    SessionComponent.prototype.getSession = function () {
        return this.sessionData.session;
    };
    SessionComponent.prototype.getDatasetList = function () {
        return utils_service_1.default.mapValues(this.sessionData.datasetsMap);
    };
    SessionComponent.prototype.getDatasetsMap = function () {
        return this.sessionData.datasetsMap;
    };
    SessionComponent.prototype.getJobsMap = function () {
        return this.sessionData.jobsMap;
    };
    SessionComponent.prototype.getModulesMap = function () {
        return this.sessionData.modulesMap;
    };
    SessionComponent.prototype.getDatasetUrl = function () {
        if (this.selectionService.selectedDatasets && this.selectionService.selectedDatasets.length > 0) {
            return this.sessionDataService.getDatasetUrl(this.selectionService.selectedDatasets[0]);
        }
    };
    SessionComponent.prototype.downloadSession = function () {
        var _this = this;
        this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).then(function (url) {
            _this.sessionDataService.download(url);
        });
    };
    SessionComponent.prototype.toggleDatasetSelection = function ($event, data) {
        this.selectionService.toggleDatasetSelection($event, data, utils_service_1.default.mapValues(this.sessionData.datasetsMap));
    };
    SessionComponent.prototype.openAddDatasetModal = function () {
        var _this = this;
        this.$uibModal.open({
            animation: true,
            templateUrl: 'leftpanel/adddatasetmodal/adddatasetmodal.html',
            controller: 'AddDatasetModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                datasetsMap: function () {
                    return new Map(_this.sessionData.datasetsMap);
                },
                sessionId: function () {
                    return _this.sessionDataService.getSessionId();
                },
                oneFile: function () { return false; },
                files: function () { return []; }
            }
        });
    };
    SessionComponent.prototype.openErrorModal = function (title, toolError) {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/joberrormodal/joberrormodal.html',
            controller: 'JobErrorModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                toolErrorTitle: function () {
                    return _.cloneDeep(title);
                },
                toolError: function () {
                    return _.cloneDeep(toolError);
                }
            }
        });
    };
    SessionComponent.prototype.getSessionEditModal = function (title, name) {
        return this.$uibModal.open({
            templateUrl: 'leftpanel/sessioneditmodal/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: function () { return _.cloneDeep(title); },
                name: function () { return _.cloneDeep(name); }
            }
        });
    };
    SessionComponent.prototype.openSessionEditModal = function () {
        var _this = this;
        var modalInstance = this.getSessionEditModal('Rename session', this.sessionData.session.name);
        modalInstance.result.then(function (result) {
            if (!result) {
                result = 'unnamed session';
            }
            _this.sessionData.session.name = result;
            _this.sessionDataService.updateSession(_this.sessionData.session);
        }, function () {
            // modal dismissed
        });
    };
    SessionComponent.prototype.openCopySessionModal = function () {
        var _this = this;
        var modalInstance = this.getSessionEditModal('Copy session', this.sessionData.session.name + '_copy');
        modalInstance.result.then(function (result) {
            if (!result) {
                result = 'unnamed session';
            }
            _this.isCopying = true;
            _this.sessionResource.copySession(_this.sessionData, result).then(function () {
                _this.isCopying = false;
            });
        }, function () {
            // modal dismissed
        });
    };
    return SessionComponent;
}());
SessionComponent.$inject = [
    '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
    'SessionEventService', 'SessionDataService', 'SelectionService', '$route', 'SessionResource',
    'SessionWorkerResource'
];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: SessionComponent,
    templateUrl: 'session.component.html'
};
//# sourceMappingURL=session.component.js.map
