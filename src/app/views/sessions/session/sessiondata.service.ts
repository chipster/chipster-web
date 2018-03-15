import { SessionResource } from '../../../shared/resources/session.resource';
import { ConfigService } from '../../../shared/services/config.service';
import Dataset from '../../../model/session/dataset';
import Job from '../../../model/session/job';
import JobInput from '../../../model/session/jobinput';
import { FileResource } from '../../../shared/resources/fileresource';
import Session from '../../../model/session/session';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from '../../../core/authentication/token.service';
import { ErrorService } from '../../../core/errorhandler/error.service';
import { RestService } from '../../../core/rest-services/restservice/rest.service';
import Rule from '../../../model/session/rule';
import { SessionData } from '../../../model/session/session-data';
import { DialogModalService } from './dialogmodal/dialogmodal.service';
import { Router } from '@angular/router';

@Injectable()
export class SessionDataService {
  private sessionId: string;

  constructor(
    private sessionResource: SessionResource,
    private configService: ConfigService,
    private fileResource: FileResource,
    private errorService: ErrorService,
    private restService: RestService,
    private tokenService: TokenService
  ) {}

  getSessionId(): string {
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
  createDerivedDataset(
    name: string,
    sourceDatasetIds: string[],
    toolName: string,
    content: string
  ) {
    let job = new Job();
    job.state = 'COMPLETED';
    job.toolCategory = 'Interactive visualizations';
    job.toolName = toolName;

    job.inputs = sourceDatasetIds.map(id => {
      let input = new JobInput();
      input.datasetId = id;
      return input;
    });

    return this.createJob(job)
      .flatMap((jobId: string) => {
        let d = new Dataset(name);
        d.sourceJob = jobId;
        return this.createDataset(d);
      })
      .flatMap((datasetId: string) => {
        return this.fileResource.uploadData(
          this.getSessionId(),
          datasetId,
          content
        );
      })
      .catch(err => {
        console.log('create derived dataset failed', err);
        throw err;
      });
  }

  cancelJob(job: Job) {
    job.state = 'CANCELLED';
    job.stateDetail = '';

    this.updateJob(job);
  }

  deleteJobs(jobs: Job[]) {
    let deleteJobs$ = jobs.map((job: Job) =>
      this.sessionResource.deleteJob(this.getSessionId(), job.jobId)
    );
    Observable.merge(...deleteJobs$).subscribe(() => {
      console.info('Job deleted');
    });
  }

  deleteDatasets(datasets: Dataset[]) {
    let deleteDatasets$ = datasets.map((dataset: Dataset) =>
      this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId)
    );
    Observable.merge(...deleteDatasets$).subscribe(() => {
      console.info('Job deleted');
    });
  }

  updateDataset(dataset: Dataset) {
    return this.sessionResource.updateDataset(this.sessionId, dataset);
  }

  updateJob(job: Job) {
    return this.sessionResource.updateJob(this.getSessionId(), job).toPromise();
  }

  updateSession(sessionData: SessionData, session: Session) {
    return this.sessionResource.updateSession(session);
  }

  getDatasetUrl(dataset: Dataset): Observable<string> {
    let datasetToken$ = this.configService
      .getSessionDbUrl()
      .flatMap((sessionDbUrl: string) =>
        this.restService.post(
          sessionDbUrl +
            '/datasettokens/sessions/' +
            this.getSessionId() +
            '/datasets/' +
            dataset.datasetId,
          null,
          true
        )
      )
      .map((datasetToken: any) => datasetToken.tokenKey);

    return Observable.forkJoin(
      datasetToken$,
      this.configService.getFileBrokerUrl()
    ).map(results => {
      let [datasetToken, url] = results;
      return `${url}/sessions/${this.getSessionId()}/datasets/${
        dataset.datasetId
      }?token=${datasetToken}`;
    });
  }

  exportDatasets(datasets: Dataset[]) {
    for (let d of datasets) {
      this.download(this.getDatasetUrl(d).map(url => url + '&download'));
    }
  }

  download(url$: Observable<string>) {
    // window has to be opened synchronously, otherwise the pop-up blocker will prevent it
    // open a new tab for the download, because Chrome complains about a download in the same tab ('_self')
    let win: any = window.open('', '_blank');
    if (win) {
      url$.subscribe(url => {
        // but we can set it's location later asynchronously
        win.location.href = url;

        // we can close the useless empty tab, but unfortunately only after a while, otherwise the
        // download won't start
        setTimeout(() => {
          win.close();
        }, 3000);
      });
    } else {
      // Chrome allows only one download
      this.errorService.headerError(
        'Browser\'s pop-up blocker prevented some exports. ' +
          'Please disable the pop-up blocker for this site or ' +
          'export the files one by one.',
        true
      );
    }
  }

  hasReadWriteAccess(sessionData: SessionData) {
    let rules = this.getApplicableRules(sessionData.session.rules);

    for (let rule of rules) {
      if (rule.readWrite) {
        return true;
      }
    }
    return false;
  }

  hasPersonalRule(rules: Array<Rule>) {
    return this.getPersonalRules(rules).length > 0;
  }

  getPersonalRules(rules: Array<Rule>) {
    return rules.filter(r => r.username === this.tokenService.getUsername());
  }

  getPublicRules(rules: Array<Rule>) {
    return rules.filter(r => r.username === 'everyone');
  }

  getApplicableRules(rules: Array<Rule>) {
    return this.getPersonalRules(rules).concat(this.getPublicRules(rules));
  }

  deletePersonalRules(session: Session) {
    return Observable.from(this.getPersonalRules(session.rules)).concatMap(
      (rule: Rule) =>
        this.sessionResource.deleteRule(session.sessionId, rule.ruleId)
    );
  }
}
