import {SessionResource} from "../../../shared/resources/session.resource";
import {ConfigService} from "../../../shared/services/config.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import JobInput from "../../../model/session/jobinput";
import {FileResource} from "../../../shared/resources/fileresource";
import Session from "../../../model/session/session";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {TokenService} from "../../../core/authentication/token.service";

@Injectable()
export class SessionDataService {

  private sessionId: string;

  constructor(
              private sessionResource: SessionResource,
              private configService: ConfigService,
              private tokenService: TokenService,
              private fileResource: FileResource) {
  }

  getSessionId() : string {
    return this.sessionId;
  }

  setSessionId(id: string) {
    this.sessionId = id;
  }

  createDataset(dataset: Dataset): Observable<string> {
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

    let d = new Dataset(name);
    return this.createDataset(d).flatMap((datasetId: string) => {
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
    }).flatMap((jobId: string) => {
      // d.datasetId is already set above
      d.sourceJob = jobId;
      return this.updateDataset(d);
    }).flatMap(() => {
      return this.fileResource.uploadData(this.getSessionId(), d.datasetId, content);
    }).catch(err => {
      console.log('create derived dataset failed', err);
      throw err;
    });
  }

  deleteJobs(jobs: Job[]) {
    let deleteJobs$ = jobs.map((job: Job) => this.sessionResource.deleteJob(this.getSessionId(), job.jobId));
    Observable.merge(...deleteJobs$).subscribe(() => {
      console.info('Job deleted');
    });
  }

  deleteDatasets(datasets: Dataset[]) {
    let deleteDatasets$ = datasets.map((dataset: Dataset) => this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId));
    Observable.merge(...deleteDatasets$).subscribe((res: any) => {
      console.info('Job deleted');
    });
  }

  updateDataset(dataset: Dataset) {
    return this.sessionResource.updateDataset(this.getSessionId(), dataset).toPromise();
  }

  updateJob(job: Job) {
    return this.sessionResource.updateJob(this.getSessionId(), job).toPromise();
  }

  updateSession(session: Session) {
    return this.sessionResource.updateSession(session);
  }

  getDatasetUrl(dataset: Dataset): Observable<string> {
    return this.configService.getFileBrokerUrl().map( (url: string) =>
      `${url}/sessions/${this.getSessionId()}/datasets/${dataset.datasetId}?token=${this.tokenService.getToken()}`
    );
  }

  exportDatasets(datasets: Dataset[]) {
    for (let d of datasets) {
      this.getDatasetUrl(d).subscribe(url => {
        this.download(url + '&download');
      });
    }
  }

  download(url: string) {
    window.open(url, "_blank");
  }
}

