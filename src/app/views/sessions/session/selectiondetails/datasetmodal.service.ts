import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, Session, Tool } from "chipster-js-common";
import * as log from "loglevel";
import { EMPTY } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { Tags, TypeTagService } from "../../../../shared/services/typetag.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SamplesModalComponent } from "../samples-modal/samples-modal.component";
import { WrangleModalComponent } from "../wrangle-modal/wrangle-modal.component";
import { DatasetHistoryModalComponent } from "./dataset-history-modal/dataset-history-modal.component";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { RouteService } from "../../../../shared/services/route.service";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class DatasetModalService {
  constructor(
    private ngbModal: NgbModal,
    private dialogModalService: DialogModalService,
    private errorService: ErrorService,
    private typeTagService: TypeTagService,
    private sessionResource: SessionResource,
    private restErrorService: RestErrorService,
    private routeService: RouteService,
  ) {}

  public openDatasetHistoryModal(dataset: Dataset, sessionData: SessionData, tools: Tool[]): void {
    const modalRef = this.ngbModal.open(DatasetHistoryModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
    modalRef.componentInstance.tools = tools;
  }

  public openWrangleModal(dataset: Dataset, sessionData: SessionData): void {
    if (
      !(
        this.typeTagService.has(sessionData, dataset, Tags.TEXT) ||
        this.typeTagService.has(sessionData, dataset, Tags.TSV)
      )
    ) {
      this.dialogModalService.openNotificationModal(
        "Converting file not possible",
        "Convert only works for tab delimeted text files.",
      );
      return;
    }

    if (dataset.size > WrangleModalComponent.FILE_SIZE_LIMIT * 1024 * 1024) {
      this.dialogModalService.openNotificationModal(
        "Converting file not possible",
        "The file is too big to be converted. The size limit is " +
          WrangleModalComponent.FILE_SIZE_LIMIT +
          " MB at the moment but it will be removed in the future.",
      );
      return;
    }

    const modalRef = this.ngbModal.open(WrangleModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;

    // modal returns the observale which runs the wrangle
    // block with the spinner while waiting for that observable to complete
    DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result)
      .pipe(
        mergeMap((runWrangle$) =>
          runWrangle$ != null
            ? this.dialogModalService.openSpinnerModal("Convert to Chipster format", runWrangle$)
            : EMPTY,
        ),
      )
      .subscribe({
        next: (result) => {
          log.info("Convert done", result);
        },
        error: (error) => this.errorService.showError("Convert to Chipster format failed", error),
      });
  }

  public openGroupsModal(datasets: Dataset[], sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(SamplesModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.datasets = datasets;
    modalRef.componentInstance.sessionData = sessionData;

    // modal returns the observale which runs the action
    // block with the spinner while waiting for that observable to complete
    DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result)
      .pipe(
        mergeMap((run$) => (run$ != null ? this.dialogModalService.openSpinnerModal("Saving groups", run$) : EMPTY)),
      )
      .subscribe({
        next: (result) => {
          log.debug("Saving groups done", result);
        },
        error: (error) => this.errorService.showError("Saving groups failed", error),
      });
  }

  public openCopySelectionToNewSessionModal(selectedDatasets: Dataset[], sessionData: SessionData) {
    this.dialogModalService
      .openSessionNameModal("Copy Selected Files to a New Session", sessionData.session.name + "_part", "Copy")
      .pipe(
        mergeMap((name) => {
          log.info("copying selected datasets and jobs");

          const selectedSessionData = this.getSessionDataOfSelection(selectedDatasets, sessionData);

          const copy = this.sessionResource.copySession(selectedSessionData, name, false);

          // return observable of the new sessionId
          return this.dialogModalService.openSpinnerModal("Copy selection", copy);
        }),
      )
      .subscribe({
        next: (newSessionId: string) => {
          if (newSessionId != null) {
            this.routeService.navigateToSession(newSessionId);
          }
        },
        error: (err) => this.restErrorService.showError("Copying selection failed", err),
      });
  }

  public openCopySelectionToExistingSessionModal(selectedDatasets: Dataset[], sessionData: SessionData) {
    this.sessionResource
      .getSessions()
      .pipe(
        mergeMap((sessions) => {
          const sessionIdToNameMap = new Map(sessions.map((s) => [s.sessionId, s.name]));

          return this.dialogModalService.openOptionModal(
            "Copy Selected files to and Existing Session",
            "Select a session into which the selected files will be copied. The files will be copied to the right side of the selected session.",
            sessionIdToNameMap,
            "Copy",
            "Select",
          );
        }),
        // we only need datasets and sessionId, not jobs
        mergeMap((targetSessionId: string) => this.sessionResource.loadSession(targetSessionId, false)),
        mergeMap((targetSessionData) => {
          log.info("copying selected datasets and jobs");

          const selectedSessionData = this.getSessionDataOfSelection(selectedDatasets, sessionData);

          this.moveFilesSideBySide(targetSessionData, selectedSessionData);

          // generate new Dataset and Job IDs so that we can merge the same datasets several times
          this.changeIds(selectedSessionData);

          const copy = this.sessionResource.copyToExistingSession(
            targetSessionData.session.sessionId,
            selectedSessionData,
          );

          // return observable of the new sessionId
          return this.dialogModalService.openSpinnerModal("Copy selection", copy);
        }),
      )
      .subscribe({
        next: (targetSession: Session) => {
          if (targetSession != null) {
            this.routeService.navigateToSession(targetSession.sessionId);
          }
        },
        error: (err) => this.restErrorService.showError("Copying selection failed", err),
      });
  }

  openMergeSessionToCurrentSessionModal(sessionData: SessionData) {
    this.sessionResource
      .getSessions()
      .pipe(
        mergeMap((sessions) => {
          const sessionIdToNameMap = new Map(sessions.map((s) => [s.sessionId, s.name]));

          return this.dialogModalService.openOptionModal(
            "Merge session",
            "Select a session to merge into the current session. The selected session will be merged to the right side of current files.",
            sessionIdToNameMap,
            "Merge",
            "Select",
          );
        }),
        mergeMap((sourceSessionId) => this.sessionResource.loadSession(sourceSessionId, true)),
        mergeMap((sourceSessionData) => {
          this.moveFilesSideBySide(sessionData, sourceSessionData);

          // generate new Dataset and Job IDs so that we can merge the same datasets several times
          this.changeIds(sourceSessionData);

          const copy = this.sessionResource.copyToExistingSession(sessionData.session.sessionId, sourceSessionData);

          // return observable of the new sessionId
          return this.dialogModalService.openSpinnerModal("Merge session", copy);
        }),
      )
      .subscribe({
        next: (x) => console.log("completed session merge", x),
        error: (err) => this.restErrorService.showError("failed to merge session", err),
      });
  }

  moveFilesSideBySide(targetSessionData: SessionData, sessionDataToMove: SessionData) {
    // find out the width of the target session workflow
    const minSourceX = Math.min(...Array.from(sessionDataToMove.datasetsMap.values()).map((d) => d.x));

    // find out the minX of the moving session workflow
    const maxTargetX = Math.max(...Array.from(targetSessionData.datasetsMap.values()).map((d) => d.x));

    // width of the target session
    // minus empty space on the left side of source session
    // and add the width of the dataset blob and little margin
    const xOffset = maxTargetX - minSourceX + 100;

    // move other session sideways
    // we can modify sourceSessionData directly, because its our own copy which we just got from the server
    Array.from(sessionDataToMove.datasetsMap.values()).forEach((dataset) => {
      // xOffset is -Infinity if the current session is empty
      if (xOffset != null && xOffset > 0 && dataset.x != null) {
        dataset.x = dataset.x + xOffset;
      }
    });
  }

  getSessionDataOfSelection(selectedDatasets: any, sessionData: SessionData): SessionData {
    const sourceJobIds = selectedDatasets.map((dataset) => dataset.sourceJob).filter((sourceJob) => sourceJob != null);

    // clone objects in case we wan't to modify them (change ID and location of selected datasets when merging to existing session)
    const sourceJobs: Map<string, Job> = new Map(
      sourceJobIds.map((jobId: string) => {
        const jobClone = _.cloneDeep(sessionData.jobsMap.get(jobId));
        return [jobId, jobClone];
      }),
    );
    const selectedDatasetsMap: Map<string, Dataset> = new Map(
      selectedDatasets.map((dataset: Dataset) => {
        const datasetClone = _.cloneDeep(dataset);
        return [dataset.datasetId, datasetClone];
      }),
    );

    return {
      session: sessionData.session,
      datasetsMap: selectedDatasetsMap,
      jobsMap: sourceJobs,
      datasetTypeTags: null,
      cachedFileHeaders: null,
    };
  }

  /**
   * Generate new Dataset and Job IDs
   *
   * @param sessionData
   */
  changeIds(sessionData: SessionData) {
    /*
    Now we generate new IDs on the client. Now when we change the IDs anyway, maybe we should let the server generate them.
    */

    // map from old ID (key) to new ID (value)
    const datasetIdMap = new Map(Array.from(sessionData.datasetsMap.keys()).map((key) => [key, uuidv4()]));
    const jobIdMap = new Map(Array.from(sessionData.jobsMap.keys()).map((key) => [key, uuidv4()]));

    // maps for updated objects
    const newDatasetsMap = new Map<string, Dataset>();
    const newJobsMap = new Map<string, Job>();

    // update datasets and their sourceJobIds
    datasetIdMap.forEach((newId, oldId) => {
      const dataset = sessionData.datasetsMap.get(oldId);
      dataset.datasetId = newId;
      if (dataset.sourceJob != null) {
        const newSourceJobId = jobIdMap.get(dataset.sourceJob);
        if (newSourceJobId == null) {
          console.log("source job not found for dataset " + dataset.name);
        } else {
          dataset.sourceJob = newSourceJobId;
        }
      }
      newDatasetsMap.set(dataset.datasetId, dataset);
    });

    // update jobs and their input datasetIds
    jobIdMap.forEach((newId, oldId) => {
      const job = sessionData.jobsMap.get(oldId);
      job.jobId = newId;
      if (job.inputs != null) {
        job.inputs.forEach((input) => {
          if (input.datasetId != null) {
            const newDatasetId = datasetIdMap.get(input.datasetId);
            if (newDatasetId == null) {
              console.log("input dataset not found for job " + job.toolId);
            } else {
              input.datasetId = newDatasetId;
            }
          }
        });
      }
      if (job.outputs != null) {
        job.outputs.forEach((output) => {
          if (output.datasetId != null) {
            const newDatasetId = datasetIdMap.get(output.datasetId);
            if (newDatasetId == null) {
              console.log("output dataset not found for job " + job.toolId);
            } else {
              output.datasetId = newDatasetId;
            }
          }
        });
      }
      newJobsMap.set(job.jobId, job);
    });

    sessionData.datasetsMap = newDatasetsMap;
    sessionData.jobsMap = newJobsMap;
  }
}
