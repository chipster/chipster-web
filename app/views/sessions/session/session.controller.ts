import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import IScopeService = angular.IScopeService;
import IRouteParamsService = angular.IRouteParamsService;
import IWindowService = angular.IWindowService;
import ILocationService = angular.ILocationService;
import IFilterService = angular.IFilterService;
import ILogService = angular.ILogService;
import IUibModalService = angular.IUibModalService;
import SelectionService from "./selection.service";

export default class SessionController {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService'];

    constructor(
        private $scope: IScopeService,
        private $routeParams: IRouteParamsService,
        private $window: IWindowService,
        private $location: ILocationService,
        private $filter: IFilterService,
        private $log: ILogService,
        private $uibModal: IUibModalService,
        private SessionEventService: SessionEventService,
        private SessionDataService: SessionDataService,
        private SelectionService: SelectionService) {

        this.init();
    }

    // create an object for the dataset search value, so that we can modify it from here
    // the search box seems to have a separate child scope, not sure why
    datasetSearch: any = {};

    selectedTab = 1;

    toolDetailList: any = null;

    workflowCallback = {
        isSelectedDataset: dataset => this.SelectionService.isSelectedDataset(dataset),
        isSelectedJob: job => this.SelectionService.isSelectedJob(job),
        clearSelection: () => this.SelectionService.clearSelection(),
        toggleDatasetSelection: ($event, data) => this.SelectionService.toggleDatasetSelection($event, data),
        showDefaultVisualization: () => this.showDefaultVisualization()
    };

    init() {
        this.SessionDataService.onSessionChange(function (event, oldValue, newValue): void {
            if (event.resourceType === 'SESSION' && event.type === 'DELETE') {
                this.$scope.$apply(function () {
                    alert('The session has been deleted.');
                    this.$location.path('sessions');
                });
            }
            if (event.resourceType === 'DATASET') {
                this.$scope.$broadcast('datasetsMapChanged', {});
            }
            if (event.resourceType === 'JOB') {
                this.$scope.$broadcast('jobsMapChanged', {});

                // if the job has just failed
                if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
                    this.$scope.openErrorModal('Job failed', newValue);
                    this.$log.info(newValue);
                }
                if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
                    this.$scope.openErrorModal('Job error', newValue);
                    this.$log.info(newValue);
                }
            }
        }.bind(this));

        // stop listening for events when leaving this view
        this.$scope.$on("$destroy", function () {
            this.SessionDataService.destroy();
        });

        // We are only handling the resize end event, currently only
        // working in workflow graph div
        this.$scope.$on("angular-resizable.resizeEnd", function () {
            this.$scope.$broadcast('resizeWorkFlowGraph', {});
        });

        angular.element(this.$window).bind('resize', function () {
            this.$scope.$broadcast('resizeWorkFlowGraph', {});
        });
    }

    datasetSearchKeyEvent = function (e) {
        if (e.keyCode == 13) { // enter
            // select highlighted datasets
            var allDatasets = this.getDatasetList();
            this.SelectionService.selectedDatasets = this.$filter('searchDatasetFilter')(allDatasets, this.datasetSearch.value);
            this.datasetSearch.value = null;
        }
        if (e.keyCode == 27) { // escape key
            // clear the search
            this.datasetSearch.value = null;
        }
    };

    getWorkflowCallback = function () {
        return this.workflowCallback;
    };

    setTab = function (tab) {
        this.selectedTab = tab;
    };

    isTab = function (tab) {
        return this.selectedTab === tab;
    };

    getJob = function (jobId) {
        return this.SessionDataService.getJob(jobId);
    };

    deleteJobs = function (jobs) {
        this.SessionDataService.deleteJobs(jobs);
    };

    deleteDatasets = function (datasets) {
        this.SessionDataService.deleteDatasets(datasets);
    };

    renameDatasetDialog = function (dataset) {
        this.SessionDataService.renameDatasetDialog(dataset);
    };

    exportDatasets = function (datasets) {
        this.SessionDataService.exportDatasets(datasets);
    };

    showDefaultVisualization = function () {
        this.$scope.$broadcast('showDefaultVisualization', {});
    };

    getSessionId = function () {
        return this.SessionDataService.getSessionId();
    };

    getSession() {
        return this.SessionDataService.session;
    }

    getDatasetList = function () {
        return this.SessionDataService.getDatasetList();
    };

    getDatasetsMap = function () {
        return this.SessionDataService.datasetsMap;
    };

    getJobsMap = function () {
        return this.SessionEventService.jobsMap;
    };

    getModulesMap = function () {
        return this.SessionDataService.modulesMap;
    };


    getDatasetUrl = function () {
        if (this.SelectionService.selectedDatasets && this.SelectionService.selectedDatasets.length > 0) {
            return this.SessionDataService.getDatasetUrl(this.SelectionService.selectedDatasets[0]);
        }
    };

    openAddDatasetModal = function () {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.html',
            controller: 'AddDatasetModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                data: function () {
                    return SessionDataService;
                }
            }
        });
    };

    openErrorModal = function (title, toolError) {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/joberrormodal/joberrormodal.html',
            controller: 'JobErrorModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                toolErrorTitle: function () {
                    return angular.copy(title);
                },
                toolError: function () {
                    return angular.copy(toolError);
                }
            }
        });
    };

    openSessionEditModal = function () {

        var modalInstance = this.$uibModal.open({
            templateUrl: 'app/views/sessions/session/sessioneditmodal/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: function () {
                    return angular.copy(this.SessionDataService.session.name);
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result) {
                result = 'unnamed session';
            }
            this.SessionDataService.session.name = result;
            this.SessionDataService.updateSession();
        }, function () {
            // modal dismissed
        });
    };
}
