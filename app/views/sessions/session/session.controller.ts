import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";

export default class SessionController {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService'];

    constructor(
        private $scope: ng.IScope,
        private $routeParams: ng.route.IRouteParamsService,
        private $window: ng.IWindowService,
        private $location: ng.ILocationService,
        private $filter: IChipsterFilter,
        private $log: ng.ILogService,
        private $uibModal: ng.ui.bootstrap.IModalService,
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
        isSelectedDataset: (dataset: Dataset) => this.SelectionService.isSelectedDataset(dataset),
        isSelectedJob: (job: Job) => this.SelectionService.isSelectedJob(job),
        clearSelection: () => this.SelectionService.clearSelection(),
        toggleDatasetSelection: ($event: any, data: Dataset) => this.SelectionService.toggleDatasetSelection($event, data),
        selectJob: ($event: any, job: Job) => this.SelectionService.selectJob($event, job),
        showDefaultVisualization: () => this.showDefaultVisualization(),
        updateDataset: (dataset: Dataset) => this.SessionDataService.updateDataset(dataset)
    };

    init() {
        this.SessionDataService.onSessionChange(function (event: any, oldValue: any, newValue: any): void {
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
        /*
        angular.element(this.$window).bind('resize', function () {
            this.$scope.$broadcast('resizeWorkFlowGraph', {});
        });*/
    }

    datasetSearchKeyEvent(e: any) {
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
    }

    getWorkflowCallback() {
        return this.workflowCallback;
    }

    getSelectedDatasets() {
        return this.SelectionService.selectedDatasets;
    }

    setTab(tab: number) {
        this.selectedTab = tab;
    }

    isTab(tab: number) {
        return this.selectedTab === tab;
    }

    getJob(jobId: string) {
        return this.SessionDataService.getJob(jobId);
    }

    deleteJobs(jobs: Job[]) {
        this.SessionDataService.deleteJobs(jobs);
    }

    deleteDatasets(datasets: Dataset[]) {
        this.SessionDataService.deleteDatasets(datasets);
    }

    renameDatasetDialog(dataset: Dataset) {
        this.SessionDataService.renameDatasetDialog(dataset);
    }

    exportDatasets(datasets: Dataset[]) {
        this.SessionDataService.exportDatasets(datasets);
    }

    showDefaultVisualization() {
        this.$scope.$broadcast('showDefaultVisualization', {});
    }

    getSessionId() {
        return this.SessionDataService.sessionId;
    }

    getSession() {
        return this.SessionDataService.session;
    }

    getDatasetList() {
        return this.SessionDataService.getDatasetList();
    }

    getDatasetsMap() {
        return this.SessionDataService.datasetsMap;
    }

    getJobsMap() {
        return this.SessionDataService.jobsMap;
    }

    getModulesMap() {
        return this.SessionDataService.modulesMap;
    }

    getDatasetUrl() {
        if (this.SelectionService.selectedDatasets && this.SelectionService.selectedDatasets.length > 0) {
            return this.SessionDataService.getDatasetUrl(this.SelectionService.selectedDatasets[0]);
        }
    }

    openAddDatasetModal() {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.html',
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
    }

    openErrorModal(title: string, toolError: string) {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'views/sessions/session/joberrormodal/joberrormodal.html',
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
    }

    openSessionEditModal() {

        var modalInstance = this.$uibModal.open({
            templateUrl: 'views/sessions/session/sessioneditmodal/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: function () {
                    return angular.copy(this.SessionDataService.sessionData.name);
                }
            }
        });

        modalInstance.result.then(function (result: string) {
            if (!result) {
                result = 'unnamed session';
            }
            this.SessionDataService.session.name = result;
            this.SessionDataService.updateSession();
        }, function () {
            // modal dismissed
        });
    }
}
