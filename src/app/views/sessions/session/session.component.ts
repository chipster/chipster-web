import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router, UrlTree } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import WsEvent from "../../../model/events/wsevent";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import Rule from "../../../model/session/rule";
import { SessionData } from "../../../model/session/session-data";
import { SessionResource } from "../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../shared/resources/sessionworker.resource";
import { RouteService } from "../../../shared/services/route.service";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { JobErrorModalComponent } from "./joberrormodal/joberrormodal.component";
import { SelectionHandlerService } from "./selection-handler.service";
import { SelectionService } from "./selection.service";
import { SessionDataService } from "./sessiondata.service";
import { SessionEventService } from "./sessionevent.service";

@Component({
  selector: "ch-session",
  templateUrl: "./session.component.html",
  styleUrls: ["./session.component.less"]
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionData: SessionData;
  deletedDatasetsTimeout: any;
  subscriptions: Array<any> = [];
  statusText: string;

  private PARAM_TEMP_COPY = "tempCopy";

  constructor(
    private router: Router,
    private sessionEventService: SessionEventService,
    private sessionDataService: SessionDataService,
    private sessionResource: SessionResource,
    public selectionService: SelectionService,
    private selectionHandlerService: SelectionHandlerService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private tokenService: TokenService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    // this.sessionData = this.route.snapshot.data['sessionData'];

    this.route.params
      .flatMap(params => {
        /*
	  Load session after every route change, not just once

	  Also this component can be reused, e.g. when a user creates her own copy
	  of an example session, she is directed to the new session.
	   */
        this.statusText = "Loading session...";
        this.selectionHandlerService.clearSelections();
        this.sessionData = null;
        return this.sessionResource.loadSession(params["sessionId"]);
      })
      .flatMap(sessionData => {
        if (this.sessionDataService.hasReadWriteAccess(sessionData)) {
          return Observable.of(sessionData);
        } else {
          this.statusText = "Copying session...";
          return this.sessionResource
            .copySession(sessionData, sessionData.session.name)
            .flatMap(sessionId => {
              const queryParams = {};
              queryParams[this.PARAM_TEMP_COPY] = true;
              return Observable.fromPromise(
                this.routeService.navigateAbsolute("/sessions")
              );
            })
            .flatMap(() => Observable.never());
        }
      })
      .do(sessionData => {
        this.sessionData = sessionData;
        this.subscribeToEvents();
      })
      .subscribe(null,
        (error: any) => {
          this.statusText = "";
          this.restErrorService.handleError(error, "Loading session failed");
        }
      );
  }

  ngOnDestroy() {
    this.sessionEventService.unsubscribe();

    this.subscriptions.forEach(subs => subs.unsubscribe());
    this.subscriptions = [];
  }

  canDeactivate() {
    if (this.PARAM_TEMP_COPY in this.route.snapshot.params) {
      const keepButton = "Keep";
      const deleteButton = "Delete";

      return this.dialogModalService
        .openTempCopyModal(
          "Keep copy?",
          "This session is a copy of another read-only session. Do you want to keep it?",
          this.sessionData.session.name,
          keepButton,
          deleteButton
        )

        .flatMap(dialogResult => {
          if (dialogResult.button === keepButton) {
            this.sessionData.session.name = dialogResult.value;
            return this.sessionDataService.updateSession(
              this.sessionData,
              this.sessionData.session
            );
          } else if (dialogResult.button === deleteButton) {
            // the user doesn't need to be notified that the session is deleted
            this.sessionEventService.unsubscribe();
            return this.sessionDataService.deletePersonalRules(
              this.sessionData.session
            );
          }
        })
        .map(() => true)
        .catch(err => {
          if (err === undefined || err === 0 || err === 1) {
            // dialog cancel, backdrop click or esc
            return Observable.of(false);
          } else {
            throw err;
          }
        });
    } else {
      return Observable.of(true);
    }
  }

  subscribeToEvents() {
    // Services don't have access to ActivatedRoute, so we have to set it
    this.sessionDataService.setSessionId(this.sessionData.session.sessionId);

    // start listening for remote changes
    // in theory we may miss an update between the loadSession() and this subscribe(), but
    // the safe way would be much more complicated:
    // - subscribe but put the updates in queue
    // - loadSession().then()
    // - apply the queued updates

    this.sessionEventService.setSessionData(
      this.sessionDataService.getSessionId(),
      this.sessionData
    );

    this.subscriptions.push(
      this.sessionEventService.getRuleStream().subscribe(change => {
        const rule: Rule = <Rule>change.oldValue;

        // rule seems to be null when we delete our own session in another browser or tab
        if (
          (change.event.type === "DELETE" && rule == null) ||
          rule.username === this.tokenService.getUsername()
        ) {
          alert("The session has been deleted.");
          this.routeService.navigateAbsolute("/sessions");
        }
      })
    );

    this.subscriptions.push(
      this.sessionEventService.getJobStream().subscribe(change => {
        const oldValue = <Job>change.oldValue;
        const newValue = <Job>change.newValue;

        // if not cancelled
        if (newValue) {
          console.log(newValue);

          // if the job has just failed
          if (
            newValue.state === "EXPIRED_WAITING" &&
            oldValue.state !== "EXPIRED_WAITING"
          ) {
            this.openErrorModal("Job expired", newValue);
            console.info(newValue);
          }
          if (newValue.state === "FAILED" && oldValue.state !== "FAILED") {
            this.openErrorModal("Job failed", newValue);
            console.info(newValue);
          }
          if (
            newValue.state === "FAILED_USER_ERROR" &&
            oldValue.state !== "FAILED_USER_ERROR"
          ) {
            this.openErrorModal("Job failed", newValue);
            console.info(newValue);
          }
          if (newValue.state === "ERROR" && oldValue.state !== "ERROR") {
            this.openErrorModal("Job error", newValue);
            console.info(newValue);
          }
        }
      })
    );
  }

  getJob(jobId: string): Job {
    return this.sessionData.jobsMap.get(jobId);
  }

  deleteDatasetsNow() {
    // cancel the timer
    clearTimeout(this.deletedDatasetsTimeout);

    // delete from the server
    this.sessionDataService.deleteDatasets(this.sessionData.deletedDatasets);

    // hide the undo message
    this.sessionData.deletedDatasets = null;
  }

  deleteDatasetsUndo() {
    // cancel the deletion
    clearTimeout(this.deletedDatasetsTimeout);

    // show datasets again in the workflowgraph
    this.sessionData.deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(
        this.sessionDataService.getSessionId(),
        "DATASET",
        dataset.datasetId,
        "CREATE"
      );
      this.sessionEventService.generateLocalEvent(wsEvent);
    });

    // hide the undo message
    this.sessionData.deletedDatasets = null;
  }

  /**
   * Poor man's undo for the dataset deletion.
   *
   * Hide the dataset from the client for ten
   * seconds and delete from the server only after that. deleteDatasetsUndo() will
   * cancel the timer and make the datasets visible again. Session copying and sharing
   * should filter out these hidden datasets or we need a proper server side support for this.
   */
  deleteDatasetsLater() {
    // let's assume that user doesn't want to undo, if she is already
    // deleting more
    if (this.sessionData.deletedDatasets) {
      this.deleteDatasetsNow();
    }

    // make a copy so that further selection changes won't change the array
    this.sessionData.deletedDatasets = _.clone(
      this.selectionService.selectedDatasets
    );

    // all selected datasets are going to be deleted
    // clear selection to avoid problems in other parts of the UI
    this.selectionHandlerService.clearDatasetSelection();

    // hide from the workflowgraph
    this.sessionData.deletedDatasets.forEach((dataset: Dataset) => {
      const wsEvent = new WsEvent(
        this.sessionDataService.getSessionId(),
        "DATASET",
        dataset.datasetId,
        "DELETE"
      );
      this.sessionEventService.generateLocalEvent(wsEvent);
    });

    // start timer to delete datasets from the server later
    this.deletedDatasetsTimeout = setTimeout(() => {
      this.deleteDatasetsNow();
    }, 10 * 1000);
  }

  exportDatasets(datasets: Dataset[]) {
    this.sessionDataService.exportDatasets(datasets);
  }

  // noinspection JSMethodCanBeStatic
  parseQueryparametersArray(queryParams: Params, key: string): Array<string> {
    switch (typeof queryParams[key]) {
      case "string":
        return [queryParams[key]];
      case "object":
        return queryParams[key];
      default:
        return [];
    }
  }

  openErrorModal(title: string, job: Job) {
    const modalRef = this.modalService.open(JobErrorModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.job = job;
  }
}
