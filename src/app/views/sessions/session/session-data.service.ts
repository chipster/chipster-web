import { SessionResource } from "../../../shared/resources/session.resource";
import { ConfigService } from "../../../shared/services/config.service";
import { Dataset } from "chipster-js-common";
import { Job, JobInput, Session, Rule, WsEvent } from "chipster-js-common";
import { FileResource } from "../../../shared/resources/fileresource";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { TokenService } from "../../../core/authentication/token.service";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestService } from "../../../core/rest-services/restservice/rest.service";
import { SessionData } from "../../../model/session/session-data";
import { SessionEventService } from "./sessionevent.service";
import { SelectionService } from "./selection.service";
import * as _ from "lodash";
import { SelectionHandlerService } from "./selection-handler.service";
import log from "loglevel";
import UtilsService from "../../../shared/utilities/utils";

@Injectable()
export class SessionDataService {
  private sessionId: string;
  deletedDatasetsTimeout: any;

  constructor(
    private sessionResource: SessionResource,
    private configService: ConfigService,
    private fileResource: FileResource,
    private errorService: ErrorService,
    private restService: RestService,
    private tokenService: TokenService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private selectionHandlerService: SelectionHandlerService
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

  createRule(rule: Rule) {
    return this.sessionResource.createRule(this.getSessionId(), rule);
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
    const job = new Job();
    job.state = "COMPLETED";
    job.toolCategory = "Interactive visualizations";
    job.toolName = toolName;

    job.inputs = sourceDatasetIds.map(id => {
      const input = new JobInput();
      input.datasetId = id;
      return input;
    });

    return this.createJob(job)
      .flatMap((jobId: string) => {
        const d = new Dataset(name);
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
        log.info("create derived dataset failed", err);
        throw err;
      });
  }

  cancelJob(job: Job) {
    job.state = "CANCELLED";
    job.stateDetail = "";

    this.updateJob(job);
  }

  deleteJobs(jobs: Job[]) {
    const deleteJobs$ = jobs.map((job: Job) =>
      this.sessionResource.deleteJob(this.getSessionId(), job.jobId)
    );
    Observable.merge(...deleteJobs$).subscribe(() => {
      log.info("Job deleted");
    });
  }

  deleteDatasets(datasets: Dataset[]) {
    const deleteDatasets$ = datasets.map((dataset: Dataset) =>
      this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId)
    );
    Observable.merge(...deleteDatasets$).subscribe(() => {
      log.info("Job deleted");
    });
  }

  deleteRule(ruleId: string) {
    return this.sessionResource.deleteRule(this.getSessionId(), ruleId);
  }

  updateDataset(dataset: Dataset) {
    return this.sessionResource.updateDataset(this.sessionId, dataset);
  }

  updateJob(job: Job) {
    return this.sessionResource.updateJob(this.getSessionId(), job).toPromise();
  }

  getDatasetUrl(dataset: Dataset): Observable<string> {
    const datasetToken$ = this.configService
      .getSessionDbUrl()
      .flatMap((sessionDbUrl: string) =>
        this.restService.post(
          sessionDbUrl +
            "/datasettokens/sessions/" +
            this.getSessionId() +
            "/datasets/" +
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
      const [datasetToken, url] = results;
      return `${url}/sessions/${this.getSessionId()}/datasets/${
        dataset.datasetId
      }?token=${datasetToken}`;
    });
  }

  exportDatasets(datasets: Dataset[]) {
    for (const d of datasets) {
      this.download(this.getDatasetUrl(d).map(url => url + "&download"));
    }
  }

  openNewTab(dataset: Dataset) {
    this.newTab(
      this.getDatasetUrl(dataset).map(url => url),
      null,
      "Browser's pop-up blocker prevented opening a new tab"
    );
  }

  download(url$: Observable<string>) {
    this.newTab(
      url$,
      3000,
      "Browser's pop-up blocker prevented some exports. " +
        "Please disable the pop-up blocker for this site or " +
        "export the files one by one."
    );
  }

  newTab(
    url$: Observable<string>,
    autoCloseDelay: number,
    popupErrorText: string
  ) {
    // window has to be opened synchronously, otherwise the pop-up blocker will prevent it
    // open a new tab for the download, because Chrome complains about a download in the same tab ('_self')
    const win: any = window.open("", "_blank");
    if (win) {
      url$.subscribe(url => {
        // but we can set it's location later asynchronously
        win.location.href = url;

        // we can close the useless empty tab, but unfortunately only after a while, otherwise the
        // download won't start
        if (autoCloseDelay) {
          setTimeout(() => {
            win.close();
          }, autoCloseDelay);
        }
      });
    } else {
      // Chrome allows only one download
      this.errorService.headerError(popupErrorText, true);
    }
  }

  hasReadWriteAccess(sessionData: SessionData) {
    const rules = this.getApplicableRules(sessionData.session.rules);

    for (const rule of rules) {
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
    return rules.filter(r => r.username === "everyone");
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

  // Added the delete dataset code here as two components are sharing the code
  deleteDatasetsNow(sessionData: SessionData) {
    // cancel the timer
    clearTimeout(this.deletedDatasetsTimeout);

    // delete from the server
    this.deleteDatasets(sessionData.deletedDatasets);

    // hide the undo message
    sessionData.deletedDatasets = null;
  }

  deleteDatasetsUndo(sessionData: SessionData) {
    // cancel the deletion
    clearTimeout(this.deletedDatasetsTimeout);

    // show datasets again in the workflowgraph
    sessionData.deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(
        this.getSessionId(),
        "DATASET",
        dataset.datasetId,
        "CREATE"
      );
      this.sessionEventService.generateLocalEvent(wsEvent);
    });

    // hide the undo message
    sessionData.deletedDatasets = null;
  }

  /**
   * Poor man's undo for the dataset deletion.
   *
   * Hide the dataset from the client for ten
   * seconds and delete from the server only after that. deleteDatasetsUndo() will
   * cancel the timer and make the datasets visible again. Session copying and sharing
   * should filter out these hidden datasets or we need a proper server side support for this.
   */
  deleteDatasetsLater(sessionData: SessionData) {
    // let's assume that user doesn't want to undo, if she is already
    // deleting more
    if (sessionData.deletedDatasets) {
      this.deleteDatasetsNow(sessionData);
    }

    // make a copy so that further selection changes won't change the array
    sessionData.deletedDatasets = _.clone(
      this.selectionService.selectedDatasets
    );

    // all selected datasets are going to be deleted
    // clear selection to avoid problems in other parts of the UI
    this.selectionHandlerService.clearDatasetSelection();

    // hide from the workflowgraph
    sessionData.deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(
        this.getSessionId(),
        "DATASET",
        dataset.datasetId,
        "DELETE"
      );
      this.sessionEventService.generateLocalEvent(wsEvent);
    });

    // start timer to delete datasets from the server later
    this.deletedDatasetsTimeout = setTimeout(() => {
      this.deleteDatasetsNow(sessionData);
    }, 10 * 1000);
  }

  getSessionSize(sessionData: SessionData): number {
    const datasetList = this.getDatasetList(sessionData);
    if (datasetList.length > 0) {
      return this.getDatasetList(sessionData)
        .map((dataset: Dataset) => dataset.size)
        .reduce((total, current) => total + current, 0);
    } else {
      return 0; // return 0 when no datasets
    }
  }

  /*
    Filter out uploading datasets

    Datasets are created when comp starts to upload them, but there are no type tags until the
    upload is finished. Hide these uploading datasets from the workflow, file list and dataset search.
    When those cannot be selected, those cannot cause problems in the visualization, which assumes that
    the type tags are do exist.
    */
  getCompleteDatasets(sessionData: SessionData): Map<string, Dataset> {
    // convert to array[[key1, value1], [key2, value2], ...] for filtering and back to map
    return new Map(
      Array.from(sessionData.datasetsMap).filter(entry => {
        const dataset = entry[1];
        return dataset.fileId != null;
      })
    );
  }

  getDatasetList(sessionData: SessionData): Dataset[] {
    return UtilsService.mapValues(this.getCompleteDatasets(sessionData));
  }

  getDatasetListSortedByCreated(sessionData: SessionData): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList(sessionData).sort((a, b) =>
      UtilsService.compareStringNullSafe(a.created, b.created)
    );
  }
}
