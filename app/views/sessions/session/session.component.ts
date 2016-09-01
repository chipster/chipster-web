
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import SessionResource from "../../../resources/session.resource";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import { SessionData } from "../../../resources/session.resource";
import UtilsService from "../../../services/utils.service";


class SessionComponent {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService', 'SessionResource', '$route'];

    datasetSearch: string;
    private selectedTab = 1;
    toolDetailList: any = null;
    sessionData: SessionData;

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
        private sessionResource: SessionResource,
        private $route: ng.route.IRouteService) {
    }

    $onInit() {
        this.sessionData = this.$route.current.locals.sessionData;

        this.sessionDataService.onSessionChange( (event: any, oldValue: any, newValue: any): void => {
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



        this.sessionDataService.subscription = this.SessionEventService.subscribe(this.sessionDataService.getSessionId(), this.sessionData, (event: any, oldValue: any, newValue: any) => {
            for (let listener of this.sessionDataService.listeners) {
                listener(event, oldValue, newValue);
            }
        });
    }

    $onDestroy() {
        // stop listening for events when leaving this view
        this.sessionDataService.destroy();
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

    getSelectedDatasets() {
        return this.selectionService.selectedDatasets;
    }

    getSelectedJobs() {
        return this.selectionService.selectedJobs;
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

    getJob(jobId: string): Job {
        return this.getJob(jobId);
    }

    getDatasetList(datasetsMap: Map): Dataset[] {
        return UtilsService.mapValues(this.sessionData.datasetsMap);
    }

    deleteJobs(jobs: Job[]) {
        this.sessionDataService.deleteJobs(jobs);
    }

    deleteDatasets(datasets: Dataset[]) {
        this.sessionDataService.deleteDatasets(datasets);
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

    getDatasetList() {
        return UtilsService.mapValues(this.sessionData.datasetsMap);
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
                    return sessionDataService;
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
                    return angular.copy(this.sessionDataService.sessionData.name);
                }
            }
        });

        modalInstance.result.then( (result: string) => {
            if (!result) {
                result = 'unnamed session';
            }
            this.sessionData.session.name = result;
            this.sessionDataService.updateSession();
        }, function () {
            // modal dismissed
        });
    }
}


export default {
    controller: SessionComponent,
    templateUrl: 'views/sessions/session/session.html'
}