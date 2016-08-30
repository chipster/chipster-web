
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import SessionResource from "../../../resources/session.resource";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import { SessionData } from "../../../resources/session.resource";

class SessionComponent {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService', 'SessionResource'];

    datasetSearch: string;
    private selectedTab = 1;
    toolDetailList: any = null;

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
        private SelectionService: SelectionService,
        private sessionResource: SessionResource) {}

    $onInit() {
        this.SessionDataService.onSessionChange( (event: any, oldValue: any, newValue: any): void => {
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
        });

        // We are only handling the resize end event, currently only
        // working in workflow graph div
        this.$scope.$on("angular-resizable.resizeEnd", () => {
            this.$scope.$broadcast('resizeWorkFlowGraph', {});
        });
        /*
         angular.element(this.$window).bind('resize', function () {
         this.$scope.$broadcast('resizeWorkFlowGraph', {});
         });*/

        this.sessionResource.loadSession(this.SessionDataService.getSessionId()).then( (parsedData: SessionData) => {
            this.SessionDataService.jobsMap = parsedData.jobsMap;
            this.SessionDataService.datasetsMap = parsedData.datasetsMap;
            this.SessionDataService.modules = parsedData.modules;
            this.SessionDataService.tools = parsedData.tools;
            this.SessionDataService.modulesMap = parsedData.modulesMap;
            this.SessionDataService.session = parsedData.session;
        });

        this.SessionDataService.subscription = this.SessionEventService.subscribe(this.SessionDataService.getSessionId(), this.SessionDataService, (event: any, oldValue: any, newValue: any) => {
            for (let listener of this.SessionDataService.listeners) {
                listener(event, oldValue, newValue);
            }
        });
    }

    $onDestroy() {
        // stop listening for events when leaving this view
        this.SessionDataService.destroy();
    }

    datasetSearchKeyEvent(e: any) {
        if (e.keyCode == 13) { // enter
            // select highlighted datasets
            var allDatasets = this.getDatasetList();
            this.SelectionService.selectedDatasets = this.$filter('searchDatasetFilter')(allDatasets, this.datasetSearch);
            this.datasetSearch = null;
        }
        if (e.keyCode == 27) { // escape key
            // clear the search
            this.datasetSearch = null;
        }
    }

    getSelectedDatasets() {
        return this.SelectionService.selectedDatasets;
    }

    getSelectedJobs() {
        return this.SelectionService.selectedJobs;
    }

    isSelectedDataset(dataset: Dataset) {
        return this.SelectionService.isSelectedDataset(dataset);
    }

    toggleDatasetSelection($event: any, dataset: Dataset) {
        this.SelectionService.toggleDatasetSelection($event, dataset);
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
                data: () => {
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
                toolErrorTitle: () => {
                    return angular.copy(title);
                },
                toolError: () => {
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
                title:  () => {
                    return angular.copy(this.SessionDataService.sessionData.name);
                }
            }
        });

        modalInstance.result.then( (result: string) => {
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


export default {
    controller: SessionComponent,
    templateUrl: 'views/sessions/session/session.html'
}