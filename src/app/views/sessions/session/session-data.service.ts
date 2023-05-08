import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Dataset,
  EventType,
  Job,
  JobInput,
  JobState,
  MetadataFile,
  Resource,
  Rule,
  Session,
  WsEvent,
} from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { ToastrService } from "ngx-toastr";
import {
  forkJoin,
  forkJoin as observableForkJoin,
  from as observableFrom,
  merge as observableMerge,
  Observable,
  of,
} from "rxjs";
import { catchError, concatMap, filter, map, mergeMap, takeUntil } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../model/session/session-data";
import { FileResource } from "../../../shared/resources/fileresource";
import { SessionResource } from "../../../shared/resources/session.resource";
import { ConfigService } from "../../../shared/services/config.service";
import UtilsService from "../../../shared/utilities/utils";
import { SelectionHandlerService } from "./selection-handler.service";
import { SessionEventService } from "./session-event.service";

@Injectable()
export class SessionDataService {
  private sessionId: string;

  constructor(
    private sessionResource: SessionResource,
    private configService: ConfigService,
    private fileResource: FileResource,
    private errorService: ErrorService,
    private tokenService: TokenService,
    private sessionEventService: SessionEventService,
    private selectionHandlerService: SelectionHandlerService,
    private toastrService: ToastrService,
    private restErrorService: RestErrorService,
    private http: HttpClient
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

  getDataset(datasetId: string): Observable<Dataset> {
    return this.sessionResource.getDataset(this.getSessionId(), datasetId);
  }

  createJob(job: Job) {
    return this.sessionResource.createJob(this.getSessionId(), job);
  }

  getJobById(jobId: string, jobs: Map<string, Job>) {
    return jobs.get(jobId);
  }

  createJobs(jobs: Job[]) {
    return this.sessionResource.createJobs(this.getSessionId(), jobs);
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
   * @returns Observable providing datasetId of the created dataset
   */
  createDerivedDataset(
    name: string,
    sourceDatasetIds: string[],
    toolName: string,
    content: string,
    toolCategory = "Interactive visualizations",
    metadataFiles: MetadataFile[] = null
  ): Observable<string> {
    const job = new Job();
    job.state = JobState.Completed;
    // FIXME don't hardcode category
    job.toolCategory = toolCategory;
    job.toolName = toolName;

    job.inputs = sourceDatasetIds.map((id) => {
      const input = new JobInput();
      input.datasetId = id;
      return input;
    });

    return this.createJob(job).pipe(
      mergeMap((jobId: string) => {
        const d = new Dataset(name);
        d.sourceJob = jobId;
        if (metadataFiles != null) {
          d.metadataFiles = metadataFiles;
        }
        return this.createDataset(d);
      }),
      mergeMap((datasetId: string) =>
        forkJoin([of(datasetId), this.fileResource.uploadData(this.getSessionId(), datasetId, content)])
      ),
      mergeMap((result) => of(result[0])),
      catchError((err) => {
        log.info("create derived dataset failed", err);
        throw err;
      })
    );
  }

  cancelJob(job: Job) {
    return this.sessionResource.cancelJob(this.sessionId, job).toPromise();
  }

  deleteJobs(jobs: Job[]) {
    const deleteJobs$ = jobs.map((job: Job) => this.sessionResource.deleteJob(this.getSessionId(), job.jobId));
    observableMerge(...deleteJobs$).subscribe(
      () => {
        log.info("Job deleted");
      },
      (err) => this.restErrorService.showError("delete jobs failed", err)
    );
  }

  deleteDatasets(datasets: Dataset[]) {
    const deleteDatasets$ = datasets.map((dataset: Dataset) =>
      this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId)
    );
    observableMerge(...deleteDatasets$).subscribe(
      () => {
        log.info("Dataset deleted");
      },
      (err) => this.restErrorService.showError("delete datasets failed", err)
    );
  }

  updateDataset(dataset: Dataset) {
    return this.sessionResource.updateDataset(this.sessionId, dataset);
  }

  updateDatasets(datasets: Dataset[]) {
    return this.sessionResource.updateDatasets(this.sessionId, datasets);
  }

  updateJob(job: Job) {
    return this.sessionResource.updateJob(this.getSessionId(), job).toPromise();
  }

  /**
   * Get a limited token for session
   *
   * The token is valid only for this one session, only for read-only operations and only for
   * a limited time, 24 hours by default.
   */
  getTokenForSession(sessionId: string): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((sessionDbUrl: string) => {
        const options = this.tokenService.getTokenParams(true);
        options["responseType"] = "text";
        return this.http.post<string>(sessionDbUrl + "/tokens/sessions/" + sessionId, null, options);
      })
    );
  }

  /**
   * Get a limited token for dataset
   *
   * The token is valid only for this one dataset, only for read-only operations and only for
   * a limited time, 1 minute by default.
   */
  getTokenForDataset(sessionId: string, datasetId: string): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((sessionDbUrl: string) => {
        const options = this.tokenService.getTokenParams(true);
        options["responseType"] = "text";

        return this.http.post<string>(
          sessionDbUrl + "/tokens/sessions/" + sessionId + "/datasets/" + datasetId,
          null,
          options
        );
      })
    );
  }

  /**
   * Get an pre-authenticated url of the dataset file
   *
   * When the url is used for something that can't set the Authorization header
   * (e.g. browser WebSocket client, file downloads and external visualization libraries)
   * we must include the authentiation information in the URL where it's more visible to
   * the user and in server logs.
   *
   * If we would use the user's own token in the URL, the user might share
   * this dataset URL without realising that the token gives access to all
   * session of the user.
   *
   * Use limited token instead, which is valid only for this one dataset on only for a limited
   * time.
   */
  getDatasetUrl(dataset: Dataset): Observable<string> {
    return observableForkJoin(
      this.getTokenForDataset(this.getSessionId(), dataset.datasetId),
      this.configService.getFileBrokerUrl()
    ).pipe(
      map((results) => {
        const [datasetToken, url] = results;
        return `${url}/sessions/${this.getSessionId()}/datasets/${dataset.datasetId}?token=${datasetToken}`;
      })
    );
  }

  exportDatasets(datasets: Dataset[]) {
    datasets.forEach((d) => this.download(this.getDatasetUrl(d).pipe(map((url) => url + "&download")), 3));
  }

  openNewTab(dataset: Dataset) {
    this.newTab(
      this.getDatasetUrl(dataset).pipe(map((url) => url)),
      null,
      null,
      "Browser's pop-up blocker prevented opening a new tab"
    );
  }

  download(url$: Observable<string>, autoCloseDelay: number) {
    this.newTab(
      url$,
      autoCloseDelay * 1000,
      "<p>Please wait until the download starts. Then you can close " +
        "this tab. It will close automatically after " +
        autoCloseDelay +
        " seconds.</p>",

      "Browser's pop-up blocker prevented some exports. " +
        "Please disable the pop-up blocker for this site or " +
        "export the files one by one."
    );
  }

  newTab(url$: Observable<string>, autoCloseDelay: number, text: string, popupErrorText: string) {
    // window has to be opened synchronously, otherwise the pop-up blocker will prevent it
    // open a new tab for the download, because Chrome complains about a download in the same tab ('_self')
    const win: any = window.open("", "_blank");
    if (win) {
      if (text) {
        win.document.write(text);
      }
      url$.subscribe(
        (url) => {
          // but we can set it's location later asynchronously
          win.location.href = url;

          // we can close the useless empty tab, but unfortunately only after a while, otherwise the
          // download won't start
          if (autoCloseDelay) {
            setTimeout(() => {
              win.close();
            }, autoCloseDelay);
          }
        },
        (err) => this.restErrorService.showError("opening a new tab failed", err)
      );
    } else {
      // Chrome allows only one download
      this.errorService.showError(popupErrorText, null);
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
    return rules.filter((r) => r.username === this.tokenService.getUsername());
  }

  getPublicRules(rules: Array<Rule>) {
    return rules.filter((r) => r.username === "everyone");
  }

  getApplicableRules(rules: Array<Rule>) {
    return this.getPersonalRules(rules).concat(this.getPublicRules(rules));
  }

  deletePersonalRules(session: Session) {
    return observableFrom(this.getPersonalRules(session.rules)).pipe(
      concatMap((rule: Rule) => this.sessionResource.deleteRule(session.sessionId, rule.ruleId))
    );
  }

  /**
   * Get pending shares for the UI
   *
   * A simple array of rules isn't enough, because the session name is
   * useful in the UI. Create a copy of the session for each shared rule
   * (there can be more than one for each session) and add only that particular
   * rule to the session's rule array.
   */
  getPendingShares(sessions: Session[]): Session[] {
    const username = this.tokenService.getUsername();

    const sharedSessions = [];

    sessions.forEach((session) => {
      session.rules.forEach((rule) => {
        if (rule.sharedBy === username) {
          const sharedSession = _.clone(session);
          sharedSession.rules = [rule];
          sharedSessions.push(sharedSession);
        }
      });
    });

    return sharedSessions;
  }

  isMySession(session: Session): boolean {
    return session.rules.some((rule) => rule.username === this.tokenService.getUsername() && !rule.sharedBy);
  }

  /**
   * TODO get exampleSessionOwnerUserId from somewhere else
   * @param session
   * @param exampleSessionOwnerUserId
   */
  isExampleSession(session: Session, exampleSessionOwnerUserId: string): boolean {
    return session.rules.some((rule) => exampleSessionOwnerUserId && rule.sharedBy === exampleSessionOwnerUserId);
  }

  isReadOnlySession(session: Session) {
    return !this.getApplicableRules(session.rules).some((rule) => rule.readWrite);
  }

  // Added the delete dataset code here as two components are sharing the code
  deleteDatasetsNow(deletedDatasets: Dataset[]) {
    // delete from the server
    this.deleteDatasets(deletedDatasets);
  }

  deleteDatasetsUndo(deletedDatasets: Dataset[]) {
    // show datasets again in the workflowgraph
    deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(this.getSessionId(), Resource.Dataset, dataset.datasetId, EventType.Create, null);
      this.sessionEventService.generateLocalEvent(wsEvent);
    });
  }

  /**
   * Poor man's undo for the dataset deletion.
   *
   * Hide the dataset from the client for ten
   * seconds and delete from the server only after that. deleteDatasetsUndo() will
   * cancel the timer and make the datasets visible again. Session copying and sharing
   * should filter out these hidden datasets or we need a proper server side support for this.
   */
  deleteDatasetsLater(datasets: Dataset[]) {
    log.info("deleting datasets" + datasets);
    // make a copy so that further selection changes won't change the array
    const deletedDatasets = _.clone(datasets);

    // all selected datasets are going to be deleted
    // clear selection to avoid problems in other parts of the UI
    this.selectionHandlerService.clearDatasetSelection();

    // hide from the workflowgraph
    deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(this.getSessionId(), Resource.Dataset, dataset.datasetId, EventType.Delete, null);
      this.sessionEventService.generateLocalEvent(wsEvent);
    });

    let msg;

    if (deletedDatasets.length === 1) {
      msg = "Deleting file " + deletedDatasets[0].name;
    } else {
      msg = "Deleting " + deletedDatasets.length + " files";
    }

    const BTN_UNDO = "Undo";

    const options = {
      positionClass: "toast-bottom-left",
      closeButton: true,
      tapToDismiss: false,
      timeOut: 5000,
      extendedTimeOut: 5000,
      buttons: [
        {
          text: BTN_UNDO,
          icon: "fas fa-undo",
          class: "btn-info",
        },
      ],
    };

    const toast = this.toastrService.info(msg, "", options);

    toast.onAction.pipe(filter((text) => text === BTN_UNDO)).subscribe(
      (buttonText) => {
        this.deleteDatasetsUndo(deletedDatasets);
        this.toastrService.clear(toast.toastId);
      },
      (err) => this.errorService.showError("error in dataset deletion", err)
    );

    toast.onHidden
      .pipe(
        takeUntil(toast.onAction) // only if there was no action
      )
      .subscribe(
        () => {
          this.deleteDatasetsNow(deletedDatasets);
          this.toastrService.clear(toast.toastId);
        },
        (err) => this.errorService.showError("error in dataset deletion", err)
      );
  }

  getSessionSize(sessionData: SessionData): number {
    const datasetList = this.getDatasetList(sessionData);
    if (datasetList.length > 0) {
      return this.getDatasetList(sessionData)
        .map((dataset: Dataset) => dataset.size)
        .reduce((total, current) => total + current, 0);
    }
    return 0; // return 0 when no datasets
  }

  /*
    Filter out uploading datasets

    Datasets are created when comp starts to upload them, but there are no type tags until the
    upload is finished. Hide these uploading datasets from the workflow, file list and dataset search.
    When those cannot be selected, those cannot cause problems in the visualization, which assumes that
    the type tags do exist.
    */
  getCompleteDatasets(datasetsMap: Map<string, Dataset>): Map<string, Dataset> {
    // convert to array[[key1, value1], [key2, value2], ...] for filtering and back to map
    return new Map(
      Array.from(datasetsMap).filter((entry) => {
        const dataset = entry[1];
        return dataset.fileId != null;
      })
    );
  }

  getDatasetList(sessionData: SessionData): Dataset[] {
    return UtilsService.mapValues(this.getCompleteDatasets(sessionData.datasetsMap));
  }

  getDatasetListSortedByCreated(sessionData: SessionData): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList(sessionData).sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created));
  }
}
