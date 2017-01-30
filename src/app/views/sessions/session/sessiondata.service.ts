import SessionResource from "../../../shared/resources/session.resource";
import IWindowService = angular.IWindowService;
import ConfigService from "../../../shared/services/config.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import SelectionService from "./selection.service";
import JobInput from "../../../model/session/jobinput";
import FileResource from "../../../shared/resources/fileresource";
import Session from "../../../model/session/session";
import * as _ from "lodash";
import * as angular from 'angular';
import {Injectable, Inject} from "@angular/core";
import {TokenService} from "../../../core/authentication/token.service";
import {Observable} from "rxjs";
import {Response} from "@angular/http";

@Injectable()
export default class SessionDataService {

  constructor(@Inject('$routeParams') private $routeParams: ng.route.IRouteParamsService,
              @Inject('SessionResource') private sessionResource: SessionResource,
              @Inject('$window') private $window: IWindowService,
              private configService: ConfigService,
              private tokenService: TokenService,
              @Inject('$uibModal') private $uibModal: any,
              private selectionService: SelectionService,
              @Inject('FileResource') private fileResource: FileResource) {
  }

  getSessionId() : string {
    return this.$routeParams['sessionId'];
  }

  createDataset(dataset: Dataset) {
    return this.sessionResource.createDataset(this.getSessionId(), dataset);
  }

  createJob(job: Job) {
    return this.sessionResource.createJob(this.getSessionId(), job);
  }

  getJobById(jobId: string, jobs: Map<string, Job>) {
    return jobs.get(jobId);
  }

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
  createDerivedDataset(name: string, sourceDatasetIds: string[], toolName: string, content: string) {

    var d = new Dataset(name);
    return this.createDataset(d).toPromise().then((datasetId: string) => {
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
      return this.fileResource.uploadData(this.getSessionId(), d.datasetId, content).toPromise();
    });
  }

  deleteJobs(jobs: Job[]) {
    let deleteJobs$ = jobs.map((job: Job) => this.sessionResource.deleteJob(this.getSessionId(), job.jobId));
    Observable.merge(...deleteJobs$).subscribe((res: any) => {
      console.info('Job deleted', res);
    });
  }

  deleteDatasets(datasets: Dataset[]) {
    let deleteDatasets$ = datasets.map((dataset: Dataset) => this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId));
    Observable.merge(...deleteDatasets$).subscribe((res: any) => {
      console.info('Job deleted', res);
    });
  }

  updateDataset(dataset: Dataset) {
    return this.sessionResource.updateDataset(this.getSessionId(), dataset).toPromise();
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

    return URI(this.configService.getFileBrokerUrl())
      .path('sessions/' + this.getSessionId() + '/datasets/' + dataset.datasetId)
      .addSearch('token', this.tokenService.getToken()).toString();

  }

  exportDatasets(datasets: Dataset[]) {
    for (let d of datasets) {
      this.download(this.getDatasetUrl(d));
    }
  }

  download(url: string) {
    this.$window.open(url, "_blank");
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
      templateUrl: './datasethistorymodal/datasethistorymodal.html',
      controller: 'DatasetHistoryModalController',
      controllerAs: 'vm',
      bindToController: true,
      resolve: {
        selectedDatasets: function () {
          return _.clone(this.selectionService.selectedDatasets);
        }.bind(this)
      }
    })
  };
}

