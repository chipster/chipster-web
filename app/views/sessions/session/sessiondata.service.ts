import SessionResource from "../../../resources/session.resource";
import ILogService = angular.ILogService;
import IWindowService = angular.IWindowService;
import ConfigService from "../../../services/config.service";
import AuthenticationService from "../../../authentication/authenticationservice";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import IModalService = angular.ui.bootstrap.IModalService;
import UtilsService from "../../../services/utils.service";
import SelectionService from "./selection.service";
import JobInput from "../../../model/session/jobinput";
import FileResource from "../../../resources/fileresource";
import Session from "../../../model/session/session";

export default class SessionDataService {

    static $inject = [
        '$routeParams', 'SessionResource', '$log', '$window', 'ConfigService', 'AuthenticationService',
         '$uibModal', 'SelectionService', 'FileResource'];

    constructor(
        private $routeParams: ng.route.IRouteParamsService,
        private sessionResource: SessionResource,
        private $log: ILogService,
        private $window: IWindowService,
        private configService: ConfigService,
        private authenticationService: AuthenticationService,
        private $uibModal: IModalService,
        private selectionService: SelectionService,
        private fileResource: FileResource) {
    }

    subscription: {unsubscribe(): void};
    listeners: any = [];

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


    getSessionId() : string {
        return this.$routeParams['sessionId'];
    }

    onSessionChange(listener: any) {
        this.listeners.push(listener);
    }

    destroy() {
        this.subscription.unsubscribe();
    }

    createDataset(dataset: Dataset) {
        return this.sessionResource.createDataset(this.getSessionId(), dataset);
    }

    createJob(job: Job) {
        return this.sessionResource.createJob(this.getSessionId(), job);
    }

    getJobById(jobId: string, jobs: Map<string, Job>){
        return jobs.get(jobId);
    }

    /**
     * Create a dataset which is derived from some other datasets.
     *
     * The file content is uploaded to the server and a fake job is created, so
     * that the datasets' relationships are shown correctly in the workflow graph.
     *
     * @param name Name of the new dataset
     * @param sourceDatasetIds Array of datasetIds shown as inputs for the new dataset
     * @param toolName e.g. name of the visualization that created this dataset
     * @param content File content, the actual data
     * @returns Promise which resolves when all this is done
     */
    createDerivedDataset(name: string, sourceDatasetIds: string[], toolName: string, content: string) {

        var d = new Dataset(name);
        return this.createDataset(d).then((datasetId: string) => {
            d.datasetId = datasetId;

            let job = new Job();
            job.state = "COMPLETED";
            job.toolCategory = "Interactive visualizations";
            job.toolName = toolName;

            job.inputs = sourceDatasetIds.map((id) => {
                let input = new JobInput();
                input.datasetId = id;
                return input;
            });

            return this.createJob(job);
        }).then((jobId: string) => {
            // d.datasetId is already set above
            d.sourceJob = jobId;
            return this.updateDataset(d);
        }).then(() => {
            return this.fileResource.uploadData(this.getSessionId(), d.datasetId, content);
        });
    }

    deleteJobs(jobs: Job[]) {
        for (let job of jobs) {
            this.sessionResource.deleteJob(this.getSessionId(), job.jobId).then( (res: any) => {
                this.$log.debug('job deleted', res);
            });
        }
    }

    deleteDatasets(datasets: Dataset[]) {

        for (let dataset of datasets) {
            this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId).then( (res: any) => {
                this.$log.debug('dataset deleted', res);
            });
        }
    }

    updateDataset(dataset: Dataset) {
        return this.sessionResource.updateDataset(this.getSessionId(), dataset);
    }

    getDatasetList(datasetsMap: Map): Dataset[] {
        return UtilsService.mapValues(datasetsMap);
    }

    updateSession(session: Session) {
        return this.sessionResource.updateSession(session);
    }

    getDatasetUrl(dataset: Dataset): string {
        //TODO should we have separate read-only tokens for datasets?
        /*
        getFileBrokerUrl() is really an async call, but let's hope some one else has initialized it already
        because the URL is used in many different places and the async result could be difficult for some
        of them.
         */

        return URI(this.configService.getFileBrokerUrlIfInitialized())
            .path('sessions/' + this.getSessionId() + '/datasets/' + dataset.datasetId)
            .addSearch('token', this.authenticationService.getToken()).toString();

    }

    exportDatasets(datasets: Dataset[]) {
        for (let d of datasets) {
            this.$window.open(this.getDatasetUrl(d), "_blank")
        }
    }

    renameDatasetDialog(dataset: Dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        this.updateDataset(dataset);
    }

    openDatasetHistoryModal() {
        this.$uibModal.open({
            templateUrl: 'views/sessions/session/datasethistorymodal/datasethistorymodal.html',
            controller: 'DatasetHistoryModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                selectedDatasets: function () {
                    return angular.copy(this.selectionService.selectedDatasets);
                }.bind(this)
            }
        })
    };
}