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
import { clone } from "lodash-es";
import log from "loglevel";
import { ProgressAnimationType, ToastrService } from "ngx-toastr";
import { Observable, forkJoin, from as observableFrom, merge as observableMerge, of } from "rxjs";
import { catchError, concatMap, filter, mergeMap, takeUntil } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../model/session/session-data";
import { FileResource } from "../../../shared/resources/fileresource";
import { SessionResource } from "../../../shared/resources/session.resource";
import { TabService } from "../../../shared/services/tab.service";
import UtilsService from "../../../shared/utilities/utils";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { SelectionHandlerService } from "./selection-handler.service";
import { SessionEventService } from "./session-event.service";
import { SessionService } from "./session.service";

@Injectable()
export class SessionDataService {
  private sessionId: string;

  constructor(
    private sessionResource: SessionResource,
    private sessionService: SessionService,
    private fileResource: FileResource,
    private errorService: ErrorService,
    private tokenService: TokenService,
    private sessionEventService: SessionEventService,
    private selectionHandlerService: SelectionHandlerService,
    private toastrService: ToastrService,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private tabService: TabService,
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
    sourceDatasets: Dataset[],
    toolName: string,
    content: string,
    toolCategory = "Interactive visualizations",
    metadataFiles: MetadataFile[] = null,
  ): Observable<string> {
    const job = new Job();
    job.state = JobState.Completed;
    // FIXME don't hardcode category
    job.toolCategory = toolCategory;
    job.toolName = toolName;

    let inputCount = 0;
    job.inputs = sourceDatasets.map((dataset) => {
      const input = new JobInput();
      input.datasetId = dataset.datasetId;
      input.inputId = "input" + inputCount;
      input.displayName = "Input " + inputCount;
      input.datasetName = dataset.name;
      inputCount++;
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
        forkJoin([of(datasetId), this.fileResource.uploadData(this.getSessionId(), datasetId, content)]),
      ),
      mergeMap((result) => of(result[0])),
      catchError((err) => {
        log.info("create derived dataset failed", err);
        throw err;
      }),
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
      (err) => this.restErrorService.showError("delete jobs failed", err),
    );
  }

  deleteDatasets(datasets: Dataset[]) {
    const deleteDatasets$ = datasets.map((dataset: Dataset) =>
      this.sessionResource.deleteDataset(this.getSessionId(), dataset.datasetId),
    );
    observableMerge(...deleteDatasets$).subscribe(
      () => {
        log.info("Dataset deleted");
      },
      (err) => this.restErrorService.showError("delete datasets failed", err),
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

  getDatasetUrl(dataset: Dataset): Observable<string> {
    return this.sessionService.getDatasetUrl(this.getSessionId(), dataset);
  }

  exportDatasets(datasets: Dataset[]) {
    this.sessionService.exportDatasets(this.getSessionId(), datasets);
  }

  openNewTab(dataset: Dataset) {
    this.tabService.openNewTab(this.getSessionId(), dataset);
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
      concatMap((rule: Rule) => this.sessionResource.deleteRule(session.sessionId, rule.ruleId)),
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
          const sharedSession = clone(session);
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

  openDeleteFilesConfirm(datasets: Dataset[]) {
    this.dialogModalService.openDeleteFilesModal(datasets).then(
      () => {
        this.deleteDatasetsLater(datasets);
      },
      () => {
        // modal dismissed
      },
    );
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
    const deletedDatasets = clone(datasets);

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
      msg = "Deleted file <b>" + deletedDatasets[0].name + "</b>";
    } else {
      msg = "Deleted " + deletedDatasets.length + " files";
    }

    const BTN_UNDO = "Undo";

    const progressAnimation: ProgressAnimationType = "increasing";

    const options = {
      positionClass: "toast-top-right",
      closeButton: true,
      tapToDismiss: false,
      timeOut: 15000,
      easeTime: 300,
      extendedTimeOut: 15000,
      progressAnimation,
      progressBar: true,
      enableHtml: true,

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
      (err) => this.errorService.showError("error in dataset deletion", err),
    );

    toast.onHidden
      .pipe(
        takeUntil(toast.onAction), // only if there was no action
      )
      .subscribe(
        () => {
          this.deleteDatasetsNow(deletedDatasets);
          this.toastrService.clear(toast.toastId);
        },
        (err) => this.errorService.showError("error in dataset deletion", err),
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
      }),
    );
  }

  getDatasetList(sessionData: SessionData): Dataset[] {
    return UtilsService.mapValues(this.getCompleteDatasets(sessionData.datasetsMap));
  }

  getJobList(sessionData: SessionData): Job[] {
    return UtilsService.mapValues(sessionData.jobsMap);
  }

  getDatasetListSortedByCreated(sessionData: SessionData): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList(sessionData).sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created));
  }
}
