import { Component, OnDestroy, OnInit } from "@angular/core";
import { Module, Rule, Session, WsEvent } from "chipster-js-common";
import { SessionState } from "chipster-js-common/lib/model/session";
import log from "loglevel";
import { forkJoin, of, Subject } from "rxjs";
import { tap } from "rxjs/internal/operators/tap";
import {
  debounceTime,
  filter,
  finalize,
  flatMap,
  map,
  mergeMap,
  takeUntil
} from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { SessionData } from "../../model/session/session-data";
import { SessionResource } from "../../shared/resources/session.resource";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import {
  SessionListMode,
  SettingsService
} from "../../shared/services/settings.service";
import { ToolsService } from "../../shared/services/tools.service";
import { DialogModalService } from "./session/dialogmodal/dialogmodal.service";
import { SessionDataService } from "./session/session-data.service";
import { SessionService } from "./session/session.service";
import { UserEventData } from "./user-event-data";
import { UserEventService } from "./user-event.service";

@Component({
  selector: "ch-session-list",
  templateUrl: "./session-list.component.html",
  styleUrls: ["./session-list.component.less"]
})
export class SessionListComponent implements OnInit, OnDestroy {
  public SessionListMode = SessionListMode; // ref for using enum in template

  public mode = SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN;
  private exampleSessionOwnerUserId: string;
  private trainingSessionOwnerUserId = "training";
  public selectedSession: Session;
  public previousSession: Session;
  public lightSelectedSession: Session;
  public sessionsByUserKeys: Array<string>;
  public sessionsByUser: Map<string, Array<Session>>;
  public sessionShares: Session[] = [];
  public deletingSessions = new Set<Session>();
  public sessionData: SessionData;
  public modulesMap: Map<string, Module>;
  public sessionSize: number;
  public sessionListLoading = false;
  public workflowPreviewLoading = false;
  public workflowPreviewFailed = false;

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  public selectionDisabled = false; // disable session selection when session context menu is open
  public noPersonalSessions = true;

  private userEventData = new UserEventData();

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    public sessionDataService: SessionDataService,
    private sessionService: SessionService,
    private routeService: RouteService,
    private restErrorService: RestErrorService,
    private userEventService: UserEventService,
    private toolsService: ToolsService,
    private configService: ConfigService,
    private tokenService: TokenService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    // subscribe to mode change
    this.settingsService.sessionListMode$.subscribe(
      (newMode: SessionListMode) => {
        this.mode = newMode;
      }
    );
    this.sessionListLoading = true;
    this.configService
      .get(ConfigService.KEY_EXAMPLE_SESSION_OWNER_USER_ID)
      .pipe(
        tap(userId => (this.exampleSessionOwnerUserId = userId)),
        mergeMap(() => this.getSessionMap()),
        tap(sessionMap => (this.userEventData.sessions = sessionMap)),
        tap(() => (this.sessionListLoading = false)),
        tap(() => this.subscribeToEvents()),
        tap(() => this.updateSessions())
      )
      .subscribe(null, (error: any) => {
        this.restErrorService.showError("Updating sessions failed", error);
      });

    // Need to check this part very carefully!!!!!!!
    this.previewThrottleSubscription = this.previewThrottle$
      .asObservable()
      // hide the loading indicator of the old session immediately
      .pipe(
        tap(() => {
          this.workflowPreviewFailed = false;
          this.workflowPreviewLoading = true;
        }),
        // wait a while to see if the user is really interested about this session
        debounceTime(500),
        filter(() => this.selectedSession !== null),
        mergeMap(session => {
          return forkJoin(
            this.sessionResource.loadSession(session.sessionId, true),
            this.toolsService.getModulesMap()
          );
        }),
        tap(results => {
          const sData = results[0];
          this.modulesMap = results[1];

          this.workflowPreviewLoading = false;
          // don't show if the selection has already changed
          if (
            this.selectedSession &&
            sData.session &&
            this.selectedSession.sessionId === sData.session.sessionId
          ) {
            this.sessionData = sData;
            this.sessionSize = this.sessionDataService.getSessionSize(
              this.sessionData
            );
          }
        }),
        // hide the spinner when unsubscribed (when the user has opened a session)
        finalize(() => (this.workflowPreviewLoading = false))
      )
      .subscribe(
        () => {},
        (error: any) => {
          this.workflowPreviewFailed = true;
          this.restErrorService.showError(
            "Loading session preview failed",
            error
          );
        }
      );
  }

  /**
   * Get all session that we have access to or have shared to others
   *
   * Server has separate methods for getting our sessions and getting our
   * sent shares. Server returns only the relevant
   * rule for each session, where our userId is in rule.username in case of our sessions
   * and in rule.sharedBy in case of shares.
   *
   * Collect all these sessions to one map for easier updating based
   * on the WebSocket events in UserEventService. When the same session is in both lists,
   * we have to merge their rules.
   */
  getSessionMap() {
    const sessionMap = new Map<string, Session>();
    const self = this;

    return this.sessionResource.getSessions().pipe(
      tap((sessions: Session[]) => {
        sessions.forEach(s => this.addOrMergeSession(sessionMap, s));
      }),
      mergeMap(() => this.sessionResource.getExampleSessions()),
      tap((sessions: Session[]) => {
        sessions.forEach(s => this.addOrMergeSession(sessionMap, s));
      }),
      mergeMap(() => this.sessionResource.getShares()),
      tap((sessions: Session[]) => {
        sessions.forEach(s => this.addOrMergeSession(sessionMap, s));
      }),
      map(() => sessionMap)
    );
  }

  addOrMergeSession(sessionMap: Map<string, Session>, s: Session) {
    if (sessionMap.has(s.sessionId)) {
      // session exists, merge rules
      const session = sessionMap.get(s.sessionId);
      const ruleMap = this.ruleArrayToMap(session.rules);
      s.rules.forEach((newRule: Rule) => {
        ruleMap.set(newRule.ruleId, newRule);
      });
      session.rules = Array.from(ruleMap.values());
    } else {
      sessionMap.set(s.sessionId, s);
    }
  }

  ruleArrayToMap(rules: Rule[]) {
    const ruleMap = new Map<string, Rule>();
    rules.forEach(r => ruleMap.set(r.ruleId, r));
    return ruleMap;
  }

  subscribeToEvents(): void {
    // start listening for remote changes
    const sessions = this.userEventData.sessions;

    this.tokenService
      .getUsername$()
      .pipe(
        tap(username =>
          this.userEventService.connect(username, this.userEventData)
        ),
        mergeMap(() => this.userEventService.getRuleStream()),
        takeUntil(this.unsubscribe)
      )
      .subscribe(
        (wsEvent: WsEvent) => {
          this.updateSessions();
          const sessionId = wsEvent.sessionId;
          // if the session was just removed
          if (!this.userEventData.sessions.has(sessionId)) {
            // try to delete from the deletingSessions
            this.deletingSessions.forEach(s => {
              if (s.sessionId === sessionId) {
                this.deletingSessions.delete(s);
              }
            });
          }
        },
        err => {
          this.restErrorService.showError("Error in event handling", err);
        }
      );
  }

  ngOnDestroy() {
    this.userEventService.unsubscribe();

    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  createSession() {
    const defaultName = "New session";
    let session;

    this.dialogModalService
      .openSessionNameModal("New session", defaultName, "Create")
      .pipe(
        flatMap(name => {
          if (!name) {
            name = defaultName;
          }

          session = new Session(name);
          session.state = SessionState.Ready;
          return this.sessionResource.createSession(session);
        }),
        tap((sessionId: string) => {
          session.sessionId = sessionId;
          this.openSession(sessionId);
        })
      )
      .subscribe(null, (error: any) => {
        this.restErrorService.showError("Creating a new session failed", error);
      });
  }

  updateSessions() {
    const sessions = Array.from(this.userEventData.sessions.values());

    // Assigning a separate key for training sessions
    sessions.forEach(s => {
      this.sessionDataService.getApplicableRules(s.rules).forEach(rule => {
        if (
          rule.sharedBy === this.exampleSessionOwnerUserId &&
          s.name.startsWith("course")
        ) {
          rule.sharedBy = this.trainingSessionOwnerUserId;
        }
      });
    });

    const sessionsByUser = new Map<string, Array<Session>>();

    // may be change the list beforehand
    // show user's own sessions first
    sessionsByUser.set(null, []);
    sessions.forEach(s => {
      this.sessionDataService.getApplicableRules(s.rules).forEach(rule => {
        if (!sessionsByUser.has(rule.sharedBy)) {
          sessionsByUser.set(rule.sharedBy, []);
        }
        // show each session only once in each list, otherwise example_session_owner will see duplicates
        if (
          !sessionsByUser
            .get(rule.sharedBy)
            .map(s2 => s2.sessionId)
            .includes(s.sessionId)
        ) {
          sessionsByUser.get(rule.sharedBy).push(s);
        }
      });
    });

    this.sessionsByUserKeys = Array.from(sessionsByUser.keys());
    // sort sessions by name
    this.sessionsByUserKeys.forEach((user: string) => {
      sessionsByUser.set(
        user,
        sessionsByUser
          .get(user)
          .sort((s1: Session, s2: Session) => s1.name.localeCompare(s2.name))
      );
    });

    // FIXME quick hack for ordering example and training sessions, needs refactor
    const exampleIndex = this.sessionsByUserKeys.indexOf(
      this.exampleSessionOwnerUserId
    );
    const trainingIndex = this.sessionsByUserKeys.indexOf(
      this.trainingSessionOwnerUserId
    );
    if (
      exampleIndex >= 0 &&
      trainingIndex >= 0 &&
      trainingIndex < exampleIndex
    ) {
      this.sessionsByUserKeys[exampleIndex] = this.trainingSessionOwnerUserId;
      this.sessionsByUserKeys[trainingIndex] = this.exampleSessionOwnerUserId;
    }

    this.sessionShares = this.sessionDataService.getPendingShares(sessions);
    this.noPersonalSessions = !(sessionsByUser.get(null).length > 0);
    this.sessionsByUser = sessionsByUser;
  }

  onSessionClick(session: Session) {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        if (this.selectionDisabled) {
          this.selectionDisabled = false;

          if (!this.deletingSessions.has(session)) {
            this.selectSession(session);
          }
          return;
        } else if (!this.deletingSessions.has(session)) {
          this.openSession(session.sessionId);
        }
        break;
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        if (this.selectionDisabled) {
          this.selectionDisabled = false;

          if (!this.deletingSessions.has(session)) {
            this.selectSession(session);
          }
          return;
        } else if (!this.deletingSessions.has(session)) {
          this.openSession(session.sessionId);
        }

        break;
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        if (this.selectionDisabled) {
          this.selectionDisabled = false;

          if (!this.deletingSessions.has(session)) {
            this.selectSession(session);
            this.lightSelectSession(session);
          }
          return;
        } else if (!this.deletingSessions.has(session)) {
          if (this.isSessionSelected(session)) {
            this.lightSelectSession(session);
            this.selectSession(null);
          } else {
            this.selectSession(session);
            this.lightSelectSession(session);
          }
        }
        break;
    }
  }

  onSessionMouseover(session: Session) {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        this.selectSession(session);
        break;
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        this.lightSelectSession(session);
        break;
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        this.lightSelectSession(session);
        break;
    }
  }

  onSessionMouseout(session: Session) {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        this.selectSession(null);
        break;
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        // this.lightSelectSession(null);
        break;
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        break;
    }
  }

  rowHighlighted(session: Session) {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        return this.isSessionSelected(session);
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        return this.isSessionLightSelected(session);
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        return this.isSessionLightSelected(session);
    }
  }

  buttonsVisible(session: Session) {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        return this.isSessionSelected(session);
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        return this.isSessionLightSelected(session);
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        return this.isSessionLightSelected(session);
    }
  }

  isAcceptVisible(sharedByUsername) {
    return (
      sharedByUsername != null &&
      sharedByUsername !== this.exampleSessionOwnerUserId &&
      sharedByUsername !== this.trainingSessionOwnerUserId
    );
  }

  getSessionRowTitle() {
    switch (this.mode) {
      case SessionListMode.CLICK_TO_OPEN_HOVER_TO_PREVIEW:
        return "Click to open";
      case SessionListMode.CLICK_TO_OPEN_BUTTON_TO_PREVIEW:
        return "Click to open";
      case SessionListMode.CLICK_TO_PREVIEW_BUTTON_TO_OPEN:
        return "Click to preview";
    }
  }

  openSession(sessionId: string) {
    this.previewThrottleSubscription.unsubscribe();
    this.routeService.navigateToSession(sessionId);
  }

  acceptSession(session: Session) {
    const rule = session.rules[0];
    rule.sharedBy = null;
    this.sessionResource
      .updateRule(session.sessionId, rule)
      .subscribe(null, (error: any) => {
        this.restErrorService.showError("Failed to accept the share", error);
      });
  }

  sessionsUploaded(sessionIds: string[]) {
    if (sessionIds.length === 1) {
      this.openSession(sessionIds[0]);
    }
  }

  selectSession(session: Session) {
    if (this.selectionDisabled || this.deletingSessions.has(session)) {
      return;
    }

    this.selectedSession = session;

    if (this.selectedSession) {
      if (session !== this.previousSession) {
        // hide the old session immediately
        this.previousSession = session;
        this.sessionData = null;
        this.sessionSize = null;
        this.previewThrottle$.next(session);
      }
    }
  }

  lightSelectSession(session: Session) {
    if (this.selectionDisabled || this.deletingSessions.has(session)) {
      return;
    }
    this.lightSelectedSession = session;
  }

  deleteSession(session: Session) {
    this.dialogModalService
      .openBooleanModal(
        "Delete session",
        "Delete session " + session.name + "?",
        "Delete",
        "Cancel"
      )
      .then(
        () => {
          if (this.selectedSession === session) {
            this.selectedSession = null;
          }
          this.deletingSessions.add(session);

          // this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
          // delete the session only from this user (i.e. the rule)
          this.sessionDataService
            .deletePersonalRules(session)
            .subscribe(null, (error: any) => {
              // FIXME close preview if open
              this.deletingSessions.delete(session);
              this.restErrorService.showError("Deleting session failed", error);
            });
        },
        () => {
          // modal dismissed
        }
      );
  }

  deleteRule(session: Session, rule: Rule) {
    this.sessionResource
      .deleteRule(session.sessionId, rule.ruleId)
      .subscribe(null, (error: any) => {
        this.restErrorService.showError("Deleting the share failed", error);
      });
  }

  isSessionSelected(session: Session) {
    return this.selectedSession === session;
  }

  isSessionLightSelected(session: Session) {
    return this.lightSelectedSession === session;
  }

  getSharedByTitlePart(userId: string): string {
    if (!userId) {
      return "Your sessions";
    } else if (userId === this.exampleSessionOwnerUserId) {
      return "Example sessions";
    } else if (userId === this.trainingSessionOwnerUserId) {
      return "Training sessions";
    } else {
      return "Shared to you by ";
    }
  }

  getSharedByUsernamePart(userId: string): string {
    if (
      !userId ||
      userId === this.exampleSessionOwnerUserId ||
      userId === this.trainingSessionOwnerUserId
    ) {
      return "";
    } else {
      return TokenService.getUsernameFromUserId(userId);
    }
  }

  rename(session: Session) {
    this.sessionService.openRenameModalAndUpdate(session);
  }

  notes(session: Session) {
    this.sessionService.openNotesModalAndUpdate(session);
  }

  download(session: Session) {
    this.sessionService.downloadSession(session.sessionId);
  }

  share(session: Session) {
    // get the session to get all rules, because session list sessions have only user's own rule
    this.sessionResource
      .getSession(session.sessionId)
      .pipe(
        tap(s =>
          this.dialogModalService.openSharingModal(
            s,
            this.userEventService.applyRuleStreamOfSession(s)
          )
        )
      )
      .subscribe(null, err => {
        this.restErrorService.showError("Get session failed", err);
      });
  }

  duplicate(session: Session) {
    let duplicateName; // ugly
    this.dialogModalService
      .openSessionNameModal("Copy session", session.name + "_copy", "Copy")
      .pipe(
        flatMap(name => {
          duplicateName = name;
          // use sessionData from preview if available
          if (
            this.sessionData &&
            this.sessionData.session.sessionId === session.sessionId
          ) {
            log.info("using session data from preview for duplicate");
            return of(this.sessionData);
          } else {
            log.info(
              "no session data from preview available, getting from server"
            );
            return this.sessionResource.loadSession(session.sessionId);
          }
        }),
        flatMap((sessionData: SessionData) => {
          const copySessionObservable = this.sessionResource.copySession(
            sessionData,
            duplicateName,
            false
          );
          return this.dialogModalService.openSpinnerModal(
            "Copy session",
            copySessionObservable
          );
        })
      )
      .subscribe(
        () => {
          log.info("updating sessions after duplicate");
          this.updateSessions();
        },
        err => {
          this.restErrorService.showError("Copy session failed", err);
        }
      );
  }

  sessionMenuOpenChange(open: boolean) {
    this.selectionDisabled = open;
  }

  getNotesButtonText(session: Session) {
    return this.sessionDataService.hasPersonalRule(session.rules)
      ? "Edit notes"
      : "View notes";
  }

  closePreview() {
    this.selectSession(null);
  }
}
