import { SessionResource } from "../../shared/resources/session.resource";
import { SessionData } from "../../model/session/session-data";
import { Component, OnInit } from "@angular/core";
import { DialogModalService } from "./session/dialogmodal/dialogmodal.service";
import { Subject } from "rxjs/Subject";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { SessionDataService } from "./session/session-data.service";
import { TokenService } from "../../core/authentication/token.service";
import { RouteService } from "../../shared/services/route.service";
import { Session, Module } from "chipster-js-common";
import { Observable, forkJoin } from "rxjs";
import { SessionService } from "./session/session.service";
import log from "loglevel";
import { SessionEventService } from "./session/sessionevent.service";
import { ToolsService } from "../../shared/services/tools.service";
import { ConfigService } from "../../shared/services/config.service";
import { tap } from "rxjs/internal/operators/tap";
import { mergeMap } from "rxjs/operators";

@Component({
  selector: "ch-session-list",
  templateUrl: "./session-list.component.html",
  styleUrls: ["./session-list.component.less"]
})
export class SessionListComponent implements OnInit {
  private exampleSessionOwnerUserId: string;

  public selectedSession: Session;
  public previousSession: Session;
  public sessionsByUserKeys: Array<string>;
  public sessionsByUser: Map<string, Array<Session>>;
  public deletingSessions = new Set<Session>();
  public sessionData: SessionData;
  public modulesMap: Map<string, Module>;
  public sessionSize: number;
  public workflowPreviewLoading = false;
  public workflowPreviewFailed = false;

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  public selectionDisabled = false; // disable session selection when session context menu is open
  public noPersonalSessions = true;

  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private errorHandlerService: RestErrorService,
    public sessionDataService: SessionDataService,
    private sessionService: SessionService,
    private routeService: RouteService,
    private restErrorService: RestErrorService,
    private sessionEventService: SessionEventService,
    private toolsService: ToolsService,
    private configService: ConfigService,
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_EXAMPLE_SESSION_OWNER_USER_ID).pipe(
      tap(userId => this.exampleSessionOwnerUserId = userId),
      mergeMap(() => this.updateSessions())
    ).subscribe(null, (error: any) => {
      this.errorHandlerService.handleError(error, "Updating sessions failed");
    });

    this.previewThrottleSubscription = this.previewThrottle$
      .asObservable()
      // hide the loading indicator of the old session immediately
      .do(() => {
        this.workflowPreviewFailed = false;
        this.workflowPreviewLoading = true;
      })
      // wait a while to see if the user is really interested about this session
      .debounceTime(500)
      .filter(() => this.selectedSession !== null)
      .flatMap(session => {
        return forkJoin(
          this.sessionResource.loadSession(session.sessionId, true),
          this.toolsService.getModulesMap()
        );
      })
      .do(results => {
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
      })
      // hide the spinner when unsubscribed (when the user has opened a session)
      .finally(() => (this.workflowPreviewLoading = false))
      .subscribe(
        () => {},
        (error: any) => {
          this.workflowPreviewFailed = true;
          this.errorHandlerService.handleError(
            error,
            "Loading session preview failed"
          );
        }
      );
  }

  createSession() {
    const defaultName = "New session";
    let session;

    this.dialogModalService
      .openSessionNameModal("New session", defaultName, "Create")
      .flatMap(name => {
        if (!name) {
          name = defaultName;
        }

        session = new Session(name);
        return this.sessionResource.createSession(session);
      })
      .do((sessionId: string) => {
        session.sessionId = sessionId;
        this.openSession(sessionId);
      })
      .subscribe(null, (error: any) => {
        this.errorHandlerService.handleError(
          error,
          "Creating a new session failed"
        );
      });
  }

  updateSessions(): Observable<Map<string, Array<Session>>> {
    return this.sessionResource.getSessions().map((sessions: Session[]) => {
      const sessionsByUser = new Map<string, Array<Session>>();

      // show user's own sessions first
      sessionsByUser.set(null, []);

      sessions.forEach(s => {
        this.sessionDataService.getApplicableRules(s.rules).forEach(rule => {
          if (!sessionsByUser.has(rule.sharedBy)) {
            sessionsByUser.set(rule.sharedBy, []);
          }
          // show each session only once in each list, otherwise example_session_owner will see duplicates
          if (
            sessionsByUser
              .get(rule.sharedBy)
              .map(s2 => s2.sessionId)
              .indexOf(s.sessionId) === -1
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

      this.noPersonalSessions = !(sessionsByUser.get(null).length > 0);
      this.sessionsByUser = sessionsByUser;
      return sessionsByUser;
    });
  }

  onSessionClick(session: Session) {
    if (this.selectionDisabled) {
      this.selectionDisabled = false;

      if (!this.deletingSessions.has(session)) {
        this.selectSession(session);
      }
      return;
    } else if (!this.deletingSessions.has(session)) {
      this.openSession(session.sessionId);
    }
  }

  openSession(sessionId: string) {
    this.previewThrottleSubscription.unsubscribe();
    this.routeService.navigateToSession(sessionId);
  }

  sessionsUploaded(sessionIds: string[]) {
    if (sessionIds.length === 1) {
      this.openSession(sessionIds[0]);
    } else {
      this.updateSessions().subscribe(null, (error: any) => {
        this.errorHandlerService.handleError(error, "Updating sessions failed");
      });
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
          this.deletingSessions.add(session);

          // this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
          // delete the session only from this user (i.e. the rule)
          this.sessionDataService.deletePersonalRules(session).subscribe(
            () => {
              this.updateSessions()
                .finally(() => {
                  if (this.selectedSession === session) {
                    this.selectedSession = null;
                  }
                  this.deletingSessions.delete(session);
                })
                .subscribe(null, (error: any) => {
                  this.errorHandlerService.handleError(
                    error,
                    "Updating sessions failed"
                  );
                });
            },
            (error: any) => {
              this.deletingSessions.delete(session);
              this.errorHandlerService.handleError(
                error,
                "Deleting session failed"
              );
            }
          );
        },
        () => {
          // modal dismissed
        }
      );
  }

  isSessionSelected(session: Session) {
    return this.selectedSession === session;
  }

  getSharedByTitlePart(userId: string): string {
    if (!userId) {
      return "Your sessions";
    } else if (userId === this.exampleSessionOwnerUserId) {
      return "Example sessions";
    } else {
      return "Shared to you by ";
    }
  }

  getSharedByUsernamePart(userId: string): string {
    if (!userId || userId === this.exampleSessionOwnerUserId) {
      return "";
    } else {
      return TokenService.getUsernameFromUserId(userId);
    }
  }

  rename(session: Session) {
    event.stopImmediatePropagation();
    this.sessionService.openRenameModalAndUpdate(session);
  }

  notes(session: Session) {
    event.stopImmediatePropagation();
    this.sessionService.openNotesModalAndUpdate(session);
  }

  download(session: Session) {
    event.stopImmediatePropagation();
    this.sessionService.downloadSession(session.sessionId);
  }

  share(session: Session) {
    event.stopImmediatePropagation();

    // HORRIBLE HACK to deal with stateful SessionEventService which
    // needs sessionData at the moment
    // FIXME refactor SessionEventService to deal with situations like this

    // load session data if not already loaded for preview
    const sessionData$ =
      this.sessionData &&
      this.sessionData.session.sessionId === session.sessionId
        ? Observable.of(this.sessionData)
        : this.sessionResource.loadSession(session.sessionId, true);

    sessionData$
      .flatMap((sessionData: SessionData) => {
        this.sessionEventService.setSessionData(session.sessionId, sessionData);
        return this.dialogModalService.openSharingModal(session).finally(() => {
          this.sessionEventService.unsubscribe();
        });
      })
      .subscribe();
  }

  duplicate(session: Session) {
    event.stopPropagation();

    let duplicateName; // ugly
    this.dialogModalService
      .openSessionNameModal(
        "Duplicate session",
        session.name + "_copy",
        "Duplicate"
      )
      .flatMap(name => {
        duplicateName = name;
        // use sessionData from preview if available
        if (
          this.sessionData &&
          this.sessionData.session.sessionId === session.sessionId
        ) {
          log.info("using session data from preview for duplicate");
          return Observable.of(this.sessionData);
        } else {
          log.info(
            "no session data from preview available, getting from server"
          );
          return this.sessionResource.loadSession(session.sessionId);
        }
      })
      .flatMap((sessionData: SessionData) => {
        const copySessionObservable = this.sessionResource.copySession(
          sessionData,
          duplicateName
        );
        return this.dialogModalService.openSpinnerModal(
          "Duplicate session",
          copySessionObservable
        );
      })
      .subscribe(
        () => {
          log.info("updating sessions after duplicate");
          this.updateSessions().subscribe(null, (error: any) => {
            this.errorHandlerService.handleError(
              error,
              "Updating sessions failed"
            );
          });
        },
        err =>
          this.restErrorService.handleError(err, "Duplicate session failed")
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
}
