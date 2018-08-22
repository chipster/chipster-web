import { SessionResource } from "../../shared/resources/session.resource";
import Session from "chipster-js-common";
import { SessionData } from "../../model/session/session-data";
import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DialogModalService } from "./session/dialogmodal/dialogmodal.service";
import { Subject } from "rxjs/Subject";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { SessionDataService } from "./session/sessiondata.service";
import { TokenService } from "../../core/authentication/token.service";
import { RouteService } from "../../shared/services/route.service";
import log from 'loglevel';

@Component({
  selector: "ch-session-list",
  templateUrl: "./session-list.component.html",
  styleUrls: ["./session-list.component.less"]
})
export class SessionListComponent implements OnInit {
  static readonly exampleSessionOwnerUserId = "jaas/example_session_owner";

  public previewedSession: Session;
  public previousSession: Session;
  public sessionsByUserKeys: Array<string>;
  public sessionsByUser: Map<string, Array<Session>>;
  public deletingSessions = new Set<Session>();
  public sessionData: SessionData;
  private selectedSessionId: string;
  public workflowPreviewLoading = false;
  public workflowPreviewFailed = false;

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  constructor(
    private router: Router,
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private errorHandlerService: RestErrorService,
    public sessionDataService: SessionDataService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
  ) {}

  ngOnInit() {
    this.updateSessions();

    this.previewThrottleSubscription = this.previewThrottle$
      .asObservable()
      // hide the loading indicator of the old session immediately
      .do(() => {
        this.workflowPreviewLoading = false;
        this.workflowPreviewFailed = false;
      })
      // wait a while to see if the user is really interested about this session
      .debounceTime(1000)
      .flatMap(session => {
        this.workflowPreviewLoading = true;
        return this.sessionResource.loadSession(session.sessionId);
      })
      .do((fullSession: SessionData) => {
        log.info("sessionData", fullSession);
        this.workflowPreviewLoading = false;
        // don't show if the selection has already changed
        if (
          this.previewedSession &&
          fullSession.session &&
          this.previewedSession.sessionId === fullSession.session.sessionId
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

  openSession(sessionId: string) {
    this.previewThrottleSubscription.unsubscribe();
    this.selectedSessionId = sessionId;
    this.routeService.navigateRelative([sessionId], this.activatedRoute);
  }

  sessionsUploaded(sessionIds: string[]) {
    if (sessionIds.length === 1) {
      this.openSession(sessionIds[0]);
    } else {
      this.updateSessions();
    }
  }

  previewSession(session: Session) {
    this.previewedSession = session;

    if (this.previewedSession) {
      if (session !== this.previousSession) {
        // hide the old session immediately
        this.previousSession = session;
        this.sessionData = null;
        this.previewThrottle$.next(session);
      }
    }
  }

  clearPreview() {
    this.previewedSession = null;
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
              this.previewedSession = null;
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
    return this.selectedSessionId === session.sessionId;
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
}
