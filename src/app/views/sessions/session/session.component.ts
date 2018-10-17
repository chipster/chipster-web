import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { Dataset, Job, Rule } from "chipster-js-common";
import { SessionData } from "../../../model/session/session-data";
import { SessionResource } from "../../../shared/resources/session.resource";
import { RouteService } from "../../../shared/services/route.service";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { JobErrorModalComponent } from "./joberrormodal/joberrormodal.component";
import { SelectionHandlerService } from "./selection-handler.service";
import { SelectionService } from "./selection.service";
import { SessionDataService } from "./sessiondata.service";
import { SessionEventService } from "./sessionevent.service";
import { Subject } from "rxjs/Subject";
import log from "loglevel";
import { SettingsService } from "../../../shared/services/settings.service";
import { UserService } from "../../../shared/services/user.service";

@Component({
  selector: "ch-session",
  templateUrl: "./session.component.html",
  styleUrls: ["./session.component.less"]
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionData: SessionData;
  deletedDatasetsTimeout: any;
  statusText: string;

  split3Visible = false;
  split1Size = 33;
  split2Size = 67;
  split3Size = 33;

  private PARAM_TEMP_COPY = "tempCopy";
  private unsubscribe: Subject<any> = new Subject();

  constructor(
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
    private routeService: RouteService,
    private settingsService: SettingsService,
    private userService: UserService
  ) {}

  ngOnInit() {
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
                this.routeService.navigateAbsolute("/analyze/" + sessionId, {
                  queryParams: queryParams
                })
              );
            })
            .flatMap(() => Observable.never());
        }
      })
      .do(sessionData => {
        this.sessionData = sessionData;

        // save latest session id
        log.info(
          "saving latest session id",
          this.sessionData.session.sessionId
        );
        this.userService.updateLatestSession(
          this.sessionData.session.sessionId
        );

        this.subscribeToEvents();
      })
      .subscribe(null, (error: any) => {
        this.statusText = "";
        this.restErrorService.handleError(error, "Loading session failed");
      });

    // subscribe to view settings
    this.settingsService.showToolsPanel$
      .takeUntil(this.unsubscribe)
      .subscribe((showToolsPanel: boolean) => {
        if (showToolsPanel) {
          this.split3Visible = true;
          this.split1Size = 30;
          this.split2Size = 45;
          this.split3Size = 25;
        } else {
          this.split3Visible = false;
          this.split1Size = 33;
          this.split2Size = 67;
          this.split3Size = 33;
        }
      });
  }

  ngOnDestroy() {
    this.sessionEventService.unsubscribe();

    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  canDeactivate() {
    if (this.route.snapshot.queryParamMap.has(this.PARAM_TEMP_COPY)) {
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

    // rule stream
    this.sessionEventService
      .getRuleStream()
      .takeUntil(this.unsubscribe)
      .subscribe(change => {
        const rule: Rule = <Rule>change.oldValue;

        // rule seems to be null when we delete our own session in another browser or tab
        if (
          (change.event.type === "DELETE" && rule == null) ||
          rule.username === this.tokenService.getUsername()
        ) {
          alert("The session has been deleted.");
          this.routeService.navigateAbsolute("/sessions");
        }
      });

    // job stream
    this.sessionEventService
      .getJobStream()
      .takeUntil(this.unsubscribe)
      .subscribe(change => {
        const oldValue = <Job>change.oldValue;
        const newValue = <Job>change.newValue;

        // if not cancelled
        if (newValue) {
          log.info(newValue);

          // if the job has just failed
          if (
            newValue.state === "EXPIRED_WAITING" &&
            oldValue.state !== "EXPIRED_WAITING"
          ) {
            this.openErrorModal("Job expired", newValue);
            log.info(newValue);
          }
          if (newValue.state === "FAILED" && oldValue.state !== "FAILED") {
            this.openErrorModal("Job failed", newValue);
            log.info(newValue);
          }
          if (
            newValue.state === "FAILED_USER_ERROR" &&
            oldValue.state !== "FAILED_USER_ERROR"
          ) {
            this.openErrorModal("Job failed", newValue);
            log.info(newValue);
          }
          if (newValue.state === "ERROR" && oldValue.state !== "ERROR") {
            this.openErrorModal("Job error", newValue);
            log.info(newValue);
          }
        }
      });
  }

  getJob(jobId: string): Job {
    return this.sessionData.jobsMap.get(jobId);
  }

  deleteDatasetsNow() {
    this.sessionDataService.deleteDatasetsNow(this.sessionData);
  }

  deleteDatasetsUndo() {
    this.sessionDataService.deleteDatasetsUndo(this.sessionData);
  }

  deleteDatasetsLater() {
    this.sessionDataService.deleteDatasetsLater(this.sessionData);
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
