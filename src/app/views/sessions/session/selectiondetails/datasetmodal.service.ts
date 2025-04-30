import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Tool } from "chipster-js-common";
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

  public openCopyToNewSessionModal(selectedDatasets: Dataset[], sessionData: SessionData) {
    this.dialogModalService
      .openSessionNameModal("Copy Selected Files to a New Session", sessionData.session.name + "_part", "Copy")
      .pipe(
        mergeMap((name) => {
          log.info("copying selected datasets and jobs");

          const sourceJobIds = selectedDatasets
            .map((dataset) => dataset.sourceJob)
            .filter((sourceJob) => sourceJob != null);

          const sourceJobs = new Map(sourceJobIds.map((jobId: string) => [jobId, sessionData.jobsMap.get(jobId)]));
          const selectedDatasetsMap = new Map(selectedDatasets.map((dataset: Dataset) => [dataset.datasetId, dataset]));

          const selectedSessionData: SessionData = {
            session: sessionData.session,
            datasetsMap: selectedDatasetsMap,
            jobsMap: sourceJobs,
            datasetTypeTags: null,
            cachedFileHeaders: null,
          };

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

  openMergeSessionModal(sessionData: SessionData) {
    this.sessionResource
      .getSessions()
      .pipe(
        mergeMap((sessions) => {
          const sessionIdToNameMap = new Map(sessions.map((s) => [s.sessionId, s.name]));

          return this.dialogModalService.openOptionModal(
            "Merge session",
            "Select session to merge into the current session. The selected session will be merged to the right side of the current files.",
            sessionIdToNameMap,
            "Merge",
            "Select",
          );
        }),
        mergeMap((sourceSessionId) => this.sessionResource.loadSession(sourceSessionId, true)),
        mergeMap((sourceSessionData) => {
          // find out the width of the current session workflow
          const maxSourceX = Math.max(...Array.from(sessionData.datasetsMap.values()).map((d) => d.x));
          // add the width of the dataset blob and little margin
          const xOffset = maxSourceX + 100;

          console.log("width of the current session is " + maxSourceX + ", move merged session by " + xOffset);

          // move other session sideways
          // we can modify sourceSessionData directly, because its our own copy which we just got from the server
          Array.from(sourceSessionData.datasetsMap.values()).forEach((dataset) => {
            // xOffset is -Infinity if the current session is empty
            if (xOffset != null && xOffset > 0 && dataset.x != null) {
              dataset.x = dataset.x + xOffset;
            }
          });

          // generate new Dataset and Job IDs so that we can merge the same datasets several times
          this.sessionResource.changeIds(sourceSessionData);

          return this.sessionResource.copyToExistingSession(sessionData.session.sessionId, sourceSessionData);
        }),
      )
      .subscribe({
        next: (x) => console.log("completed session merge", x),
        error: (err) => this.restErrorService.showError("failed to merge session", err),
      });
  }
}
