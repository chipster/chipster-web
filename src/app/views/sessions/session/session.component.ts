
import {IChipsterFilter} from "../../../common/filter/chipsterfilter";
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import { SessionData } from "../../../resources/session.resource";
import * as _ from "lodash";

class SessionComponent {

    static $inject = [
        '$scope', '$routeParams', '$window', '$location', '$filter', '$log', '$uibModal',
        'SessionEventService', 'SessionDataService', 'SelectionService', '$route'];

    toolDetailList: any = null;
    sessionData: SessionData;
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
        private $route: ng.route.IRouteService) {
    }

    $onInit() {
        this.sessionData = this.$route.current.locals['sessionData'];
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

    getSelectedDatasets() {
        return this.selectionService.selectedDatasets;
    }

    getSelectedJobs() {
        return this.selectionService.selectedJobs;
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

        // show datasets again in the workflowgraph
        this.deletedDatasets.forEach((dataset: Dataset) => {
            this.sessionData.datasetsMap.set(dataset.datasetId, dataset);
        });

        // hide the undo message
        this.deletedDatasets = null;
    }

    deleteDatasetsLater() {
        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);

        // hide from the workflowgraph
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
}


export default {
    controller: SessionComponent,
    templateUrl: './session.component.html'
}
