import { Component, OnDestroy, OnInit, HostListener } from "@angular/core";
import {
  ActivatedRoute,
  Params,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import {
  Dataset,
  Job,
  Rule,
  Tool,
  Module,
  Session,
  EventType,
  JobState,
  SessionState
} from "chipster-js-common";
import { SessionData } from "../../../model/session/session-data";
import { SessionResource } from "../../../shared/resources/session.resource";
import { RouteService } from "../../../shared/services/route.service";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { JobErrorModalComponent } from "./joberrormodal/joberrormodal.component";
import { SelectionHandlerService } from "./selection-handler.service";
import { SelectionService } from "./selection.service";
import { SessionDataService } from "./session-data.service";
import { SessionEventService } from "./session-event.service";
import { Subject } from "rxjs/Subject";
import log from "loglevel";
import { SettingsService } from "../../../shared/services/settings.service";
import { UserService } from "../../../shared/services/user.service";
import { SessionService } from "./session.service";
import { ToolsService } from "../../../shared/services/tools.service";
import { forkJoin } from "rxjs";
import { ConfigService } from "../../../shared/services/config.service";
import { ToastrService } from "ngx-toastr";

export enum ComponentState {
  LOADING_SESSION = "Loading session...",
  DELETING_SESSION = "Deleting session...",
  READY = "Session ready",
  NOT_FOUND = "Session not found",
  FAIL = "" // empty to avoid duplicate error messages
}
@Component({
  selector: "ch-session",
  templateUrl: "./session.component.html",
  styleUrls: ["./session.component.less"]
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionData: SessionData;
  tools: Tool[];
  modules: Module[];
  modulesMap: Map<string, Module>;
  deletedDatasetsTimeout: any;

  ComponentState = ComponentState; // for using the enum in template
  state = ComponentState.LOADING_SESSION;

  split3Visible = false;
  split1Size = 33;
  split2Size = 67;
  split3Size = 33;

  private exampleSessionOwnerUserId: string;
  private PARAM_SOURCE_SESSION = "sourceSession";

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private sessionEventService: SessionEventService,
    private sessionDataService: SessionDataService,
    private sessionResource: SessionResource,
    private sessionService: SessionService,
    public selectionService: SelectionService,
    private selectionHandlerService: SelectionHandlerService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private tokenService: TokenService,
    public routeService: RouteService, // used from template
    private settingsService: SettingsService,
    private userService: UserService,
    private toolsService: ToolsService,
    private configService: ConfigService,
    private toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.route.params
      .mergeMap(params => {
        /*
	  Load session after every route change, not just once

	  Also this component can be reused, e.g. when a user creates her own copy
	  of an example session, she is directed to the new session.
	   */
        this.state = ComponentState.LOADING_SESSION;
        this.selectionHandlerService.clearSelections();
        this.sessionData = null;

        const sessionId = params["sessionId"];
        return this.sessionResource
          .getSession(sessionId)
          .catch(err => {
            // if session not found but sourceSession url param exists, go there
            return this.trySourceSessionIfSessionNotFound(err); // either navigate and return empty observable or rethrow err
          })
          .mergeMap((session: Session) => {
            this.removeSourceSessionParamIfRegularSession(session); // may redirecto to session url without the query param

            const sessionData$ = this.getSessionData(session.sessionId);
            const tools$ = this.toolsService.getTools();
            const modules$ = this.toolsService.getModules();
            const modulesMap$ = this.toolsService.getModulesMap();
            const exampleSessionOwner$ = this.configService.get(
              ConfigService.KEY_EXAMPLE_SESSION_OWNER_USER_ID
            );

            return forkJoin(
              sessionData$,
              tools$,
              modules$,
              modulesMap$,
              exampleSessionOwner$
            );
          });
      })
      .subscribe(
        results => {
          // save loaded stuff
          this.sessionData = results[0];
          this.tools = results[1];
          this.modules = results[2];
          this.modulesMap = results[3];
          this.exampleSessionOwnerUserId = results[4];

          // save latest session id
          this.saveLatestSession();

          this.subscribeToEvents();

          // ready to go
          this.state = ComponentState.READY;
        },
        (error: any) => {
          if (RestErrorService.isNotFound(error)) {
            this.state = ComponentState.NOT_FOUND;
          } else {
            this.state = ComponentState.FAIL;
            this.restErrorService.handleError(error, "Loading session failed");
          }
        }
      );

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

  /**
   * For a temporary session with changes, ask whether to keep or discard the session
   *
   */
  canDeactivate(
    sessionComponent: SessionComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> {
    // cancel navigation if destination is appName/analyze, e.g. when clicking Analyze in nav bar when in session view
    if (
      nextState &&
      nextState.url &&
      nextState.url === this.routeService.getRouterLinkAnalyze()
    ) {
      return Observable.of(false);
    }

    /*
    No need to ask if the session was already deleted

    If user opens an example session and then deletes it, the client receives a websocket
    event about the deleted rule and deletes that rule from the sessionData.
    */
    if (this.state === ComponentState.DELETING_SESSION) {
      return Observable.of(true);
    }

    // session has been deleted already, also avoid null problems in later checks
    if (!this.sessionData) {
      return Observable.of(true);
    }

    // no access anymore
    if (
      this.sessionDataService.getApplicableRules(this.sessionData.session.rules)
        .length < 1
    ) {
      return Observable.of(true);
    }

    // temp session, no changes --> delete
    if (this.sessionData.session.state === SessionState.TemporaryUnmodified) {
      return this.deleteTempSession();
    }

    // temporary session with changes, ask what to do
    if (this.sessionData.session.state === SessionState.TemporaryModified) {
      return this.askKeepOrDiscardSession();
    }

    // normal case, no actions needed
    return Observable.of(true);
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

        if (
          change.event.type === EventType.Delete &&
          rule.username === this.tokenService.getUsername()
        ) {
          this.sessionEventService.unsubscribe();
          this.toastrService.info(
            this.sessionData.session.name,
            "Session deleted"
          );
          this.routeService.navigateAbsolute("/sessions");
        }
      });

    // job stream
    this.sessionEventService
      .getJobStream()
      .takeUntil(this.unsubscribe)
      .subscribe(change => {
        const event = change.event;
        const oldValue = <Job>change.oldValue;
        const newValue = <Job>change.newValue;

        // log to catch unexpected null oldvalue
        if (event.type !== "CREATE" && !oldValue) {
          log.warn(
            "got job event with no old value when even type is other than CREATE, investigate further",
            "event:",
            event,
            "old value:",
            oldValue,
            "new value:",
            newValue
          );
        }        

        // if not cancelled
        if (newValue) {
          // if the job has just failed
          if (
            newValue.state === JobState.ExpiredWaiting &&
            (oldValue == null || oldValue.state !== JobState.ExpiredWaiting)
          ) {
            this.openErrorModal("Job expired", newValue);
          } else if (
            newValue.state === JobState.Failed &&
            (oldValue == null || oldValue.state !== JobState.Failed)
          ) {
            this.openErrorModal("Job failed", newValue);
          } else if (
            newValue.state === JobState.FailedUserError &&
            (oldValue == null || oldValue.state !== JobState.FailedUserError)
          ) {
            this.openErrorModal("Job failed", newValue);
          } else if (
            newValue.state === JobState.Error &&
            (oldValue == null || oldValue.state !== JobState.Error)
          ) {
            this.openErrorModal("Job error", newValue);
          }
        }
      });
  }

  getJob(jobId: string): Job {
    return this.sessionData.jobsMap.get(jobId);
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

  private getSessionData(sessionId: string) {
    return this.sessionResource.loadSession(sessionId).flatMap(sessionData => {
      if (this.sessionDataService.hasReadWriteAccess(sessionData)) {
        return Observable.of(sessionData);
      } else {
        log.info("read-only sesssion, create copy");
        return this.sessionResource
          .copySession(sessionData, sessionData.session.name, true)
          .flatMap(id => {
            const queryParams = {};
            queryParams[this.PARAM_SOURCE_SESSION] = sessionId;
            return Observable.fromPromise(
              this.routeService.navigateAbsolute("/analyze/" + id, {
                queryParams: queryParams
              })
            );
          })
          .flatMap(() => Observable.never());
      }
    });
  }

  /**
   * Return true when done.
   */
  private deleteTempSession(): Observable<boolean> {
    this.state = ComponentState.DELETING_SESSION;

    // the user doesn't need to be notified that the session is deleted
    this.sessionEventService.unsubscribe();
    return this.sessionDataService
      .deletePersonalRules(this.sessionData.session)
      .map(() => true);
  }

  /**
   * Just send the delete rule request. React to deletion when rule deletion event arrives in the
   * rule stream.
   *
   * @param session
   */
  public onDeleteSession(session: Session) {
    this.state = ComponentState.DELETING_SESSION;

    this.sessionDataService
      .deletePersonalRules(this.sessionData.session)
      .subscribe(
        () => {
          log.debug("delete session request done");
        },
        error => {
          // TODO add error handling
        }
      );
  }

  askKeepOrDiscardSession(): Observable<boolean> {
    const keepButton = "Save new session";
    const deleteButton = "Discard changes";

    return this.dialogModalService
      .openTempCopyModal(
        "Save changes?",
        "<p>" +
          this.getKeepDialogFirstParagraph() +
          "</p><p>Do you want to save the changes to a new session or just discard them?</p>",
        this.sessionData.session.name,
        keepButton,
        deleteButton
      )
      .flatMap(dialogResult => {
        if (dialogResult.button === keepButton) {
          this.sessionData.session.name = dialogResult.value;
          this.sessionData.session.state = SessionState.Ready;
          return this.sessionService
            .updateSession(this.sessionData.session)
            .map(() => true);
        } else if (dialogResult.button === deleteButton) {
          return this.deleteTempSession();
        }
      })
      .catch(err => {
        if (err === undefined || err === 0 || err === 1) {
          // dialog cancel, backdrop click or esc
          return Observable.of(false);
        } else {
          throw err;
        }
      });
  }

  private getKeepDialogFirstParagraph(): string {
    if (
      this.sessionData.session.rules.some(
        (rule: Rule) => rule.sharedBy === this.exampleSessionOwnerUserId
      )
    ) {
      return "You have made changes to a <em>read-only<em> example session.";
    } else {
      return "You have made changes to a <em>read-only</em> shared session.";
    }
  }

  doScrollFix() {
    const scrollToTop = setInterval(() => {
      const div = document.getElementById("myDiv");
      const visRect = document.getElementById("visTab").getBoundingClientRect();
      if (visRect.top < 1) {
        div.scrollTo(0, 0);
      } else {
        clearInterval(scrollToTop);
      }
    }, 16);
  }

  private trySourceSessionIfSessionNotFound(error): Observable<any> {
    if (RestErrorService.isNotFound(error)) {
      const sourceSessionId = this.getSourceSessionId();
      if (sourceSessionId) {
        log.info("session not found, going to source session", sourceSessionId);
        this.routeService.navigateAbsolute("/analyze/" + sourceSessionId);
        return Observable.empty();
      }
    }
    throw error;
  }

  private getSourceSessionId(): string {
    return this.route.snapshot.queryParamMap.get(this.PARAM_SOURCE_SESSION);
  }

  private saveLatestSession() {
    const sourceSession = this.getSourceSessionId();
    if (sourceSession) {
      this.userService.updateLatestSession(
        this.sessionData.session.sessionId,
        sourceSession
      );
    } else {
      this.userService.updateLatestSession(this.sessionData.session.sessionId);
    }

    log.info(
      "saving latest session id",
      this.sessionData.session.sessionId,
      sourceSession
    );
  }

  private removeSourceSessionParamIfRegularSession(session: Session) {
    if (session.state === SessionState.Ready && this.getSourceSessionId()) {
      log.info(
        "opening session with state: ready, but source url param exists, redirect to id without parameters"
      );
      this.routeService.navigateAbsolute("/analyze/" + session.sessionId, {
        replaceUrl: true
      });
    }
  }
}
