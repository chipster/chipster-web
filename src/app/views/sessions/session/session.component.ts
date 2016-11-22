
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import SessionResource from "../../../resources/session.resource";
import SessionWorkerResource from "../../../resources/sessionworker.resource";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import { SessionData } from "../../../resources/session.resource";
import UtilsService from "../../../services/utils.service";
import * as _ from "lodash";

class SessionComponent {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService', '$route', 'SessionResource',
        'SessionWorkerResource'];

    datasetSearch: string;
    private selectedTab = 1;
    toolDetailList: any = null;
    sessionData: SessionData;
    private isCopying = false;
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
        private $route: ng.route.IRouteService,
        private sessionResource: SessionResource,
        private sessionWorkerResource: SessionWorkerResource) {
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

        // show datasets again in the workflow
        this.deletedDatasets.forEach((dataset: Dataset) => {
            this.sessionData.datasetsMap.set(dataset.datasetId, dataset);
        });

        // hide the undo message
        this.deletedDatasets = null;
    }

    deleteDatasetsLater() {

        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);

        // hide from the workflow
        this.deletedDatasets.forEach((dataset: Dataset) => {
            this.sessionData.datasetsMap.delete(dataset.datasetId);
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

    downloadSession() {
        this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).then((url) => {
            this.sessionDataService.download(url);
        })
    }

    toggleDatasetSelection($event, data) {
         this.selectionService.toggleDatasetSelection($event, data, UtilsService.mapValues(this.sessionData.datasetsMap));
    }

    openAddDatasetModal() {
        this.$uibModal.open({
            animation: true,
            templateUrl: './workflow/adddatasetmodal/adddatasetmodal.html',
            controller: 'AddDatasetModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                datasetsMap: () => {
                    return new Map(this.sessionData.datasetsMap);
                },
                sessionId: () => {
                    return this.sessionDataService.getSessionId();
                },
                oneFile: () => false,
	            files: () => []
            }
        });
    }

    openErrorModal(title: string, toolError: string) {
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
                    return _.cloneDeep(toolError);
                }
            }
        });
    }

    getSessionEditModal(title: string, name: string) {
        return this.$uibModal.open({
            templateUrl: './sessioneditmodal/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: () => _.cloneDeep(title),
                name: () => _.cloneDeep(name)
            }
        });
    }

    openSessionEditModal() {
        var modalInstance = this.getSessionEditModal('Rename session', this.sessionData.session.name);

        modalInstance.result.then( (result: string) => {
            if (!result) {
                result = 'unnamed session';
            }
            this.sessionData.session.name = result;
            this.sessionDataService.updateSession(this.sessionData.session);
        }, function () {
            // modal dismissed
        });
    }

    openCopySessionModal() {
        var modalInstance = this.getSessionEditModal('Copy session', this.sessionData.session.name + '_copy');


        modalInstance.result.then( (result: string) => {
            if (!result) {
                result = 'unnamed session';
            }
            this.isCopying = true;
            this.sessionResource.copySession(this.sessionData, result).then(() => {
                this.isCopying = false;
            })
        }, function () {
            // modal dismissed
        });
    }
}


export default {
    controller: SessionComponent,
    templateUrl: './session.html'
}
