import { SessionResource } from "../../shared/resources/session.resource";
import { SessionData } from "../../model/session/session-data";
import { Component, OnInit } from "@angular/core";
import { DialogModalService } from "./session/dialogmodal/dialogmodal.service";
import { Subject } from "rxjs/Subject";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { SessionDataService } from "./session/sessiondata.service";
import { TokenService } from "../../core/authentication/token.service";
import { RouteService } from "../../shared/services/route.service";
import { Session } from "chipster-js-common";
import { Observable } from "rxjs";
import { SessionService } from "./session/session.service";
import log from "loglevel";

@Component({
  selector: "ch-session-list",
  templateUrl: "./session-list.component.html",
  styleUrls: ["./session-list.component.less"]
})
export class SessionListComponent implements OnInit {
  static readonly exampleSessionOwnerUserId = "jaas/example_session_owner";

  public selectedSession: Session;
  public previousSession: Session;
  public sessionsByUserKeys: Array<string>;
  public sessionsByUser: Map<string, Array<Session>>;
  public deletingSessions = new Set<Session>();
  public sessionData: SessionData;
  public workflowPreviewLoading = false;
  public workflowPreviewFailed = false;

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  public selectionDisabled = false; // disable session selection when session context menu is open

  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private errorHandlerService: RestErrorService,
    public sessionDataService: SessionDataService,
    private sessionService: SessionService,
    private routeService: RouteService,
    private restErrorService: RestErrorService
  ) {}

  ngOnInit() {
    this.updateSessions();

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
        return this.sessionResource.loadSession(session.sessionId);
      })
      .do((fullSession: SessionData) => {
        this.workflowPreviewLoading = false;
        // don't show if the selection has already changed
        if (
          this.selectedSession &&
          fullSession.session &&
          this.selectedSession.sessionId === fullSession.session.sessionId
        ) {
          this.sessionData = fullSession;
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

  updateSessions() {
    this.sessionResource.getSessions().subscribe(
      (sessions: Session[]) => {
        const sessionsByUser = new Map();
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

        this.sessionsByUser = sessionsByUser;
        this.sessionsByUserKeys = Array.from(sessionsByUser.keys());
      },
      (error: any) => {
        this.errorHandlerService.handleError(error, "Loading sessions failed");
      }
    );
  }

  onSessionClick(session: Session) {
    if (this.selectionDisabled) {
      this.selectionDisabled = false;
      this.selectSession(session);
      return;
    } else {
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
      this.updateSessions();
    }
  }

  selectSession(session: Session) {
    if (this.selectionDisabled) {
      return;
    }

    this.selectedSession = session;

    if (this.selectedSession) {
      if (session !== this.previousSession) {
        // hide the old session immediately
        this.previousSession = session;
        this.sessionData = null;
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
              this.updateSessions();
              this.selectedSession = null;
              this.deletingSessions.delete(session);
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
    } else if (userId === SessionListComponent.exampleSessionOwnerUserId) {
      return "Example sessions";
    } else {
      return "Shared to you by ";
    }
  }

  getSharedByUsernamePart(userId: string): string {
    if (!userId || userId === SessionListComponent.exampleSessionOwnerUserId) {
      return "";
    } else {
      return TokenService.getUsernameFromUserId(userId);
    }
  }

  rename(session: Session) {
    event.stopPropagation();
    this.sessionService.openRenameModalAndUpdate(session);
  }

  notes(session: Session) {
    event.stopPropagation();
    this.sessionService.openNotesModalAndUpdate(session);
  }

  duplicate(session: Session) {
    event.stopPropagation();

    let duplicateName; // ugly
    this.dialogModalService
      .openSessionNameModal("Duplicate session", session.name + "_copy")
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
          this.updateSessions();
        },
        err =>
          this.restErrorService.handleError(err, "Duplicate session failed")
      );
  }

  sessionMenuOpenChange(open: boolean) {
    this.selectionDisabled = open;
  }
}
