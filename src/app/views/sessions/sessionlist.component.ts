
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";
import {Subject} from "rxjs";
import {RestErrorService} from "../../core/errorhandler/rest-error.service";
import {SessionDataService} from "./session/sessiondata.service";

@Component({
  selector: 'ch-session-list',
  templateUrl: './sessionlist.html',
  styleUrls: ['./sessionlist.less']
})
export class SessionListComponent {

  public previewedSession: Session;
  public previousSession: Session;
  public sessionsByUserKeys: Array<string>;
  public sessionsByUser: Map<string, Array<Session>>;
  public sessionData: SessionData;
  private selectedSessionId: string;
  private workflowPreviewLoading = false;
  private workflowPreviewFailed = false;

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  constructor(
    private router: Router,
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private errorHandlerService: RestErrorService,
    private sessionDataService: SessionDataService) {}


  ngOnInit() {
    this.updateSessions();

    this.previewThrottleSubscription = this.previewThrottle$.asObservable()
    // hide the loading indicator of the old session immediately
      .do(() => {
        this.workflowPreviewLoading = false;
        this.workflowPreviewFailed = false;
      })
      // wait a while to see if the user is really interested about this session
      .debounceTime(1000)
      .flatMap(session => {
        this.workflowPreviewLoading = true;
        return this.sessionResource.loadSession(session.sessionId)
      })
      .do((fullSession: SessionData) => {
        this.workflowPreviewLoading = false;
        // don't show if the selection has already changed
        if (this.previewedSession && fullSession.session && this.previewedSession.sessionId === fullSession.session.sessionId) {
          this.sessionData = fullSession;
        }
      })
      // hide the spinner when unsubscribed (when the user has opened a session)
      .finally(() => this.workflowPreviewLoading = false)
      .subscribe(() => {},
        (error: any) => {
          this.workflowPreviewFailed = true;
          this.errorHandlerService.handleError(error, "Loading session preview failed");
        });
  }

  createSession() {
    const defaultName = "New session";

    this.dialogModalService.openStringModal("New session", "Session name",
      defaultName, "Create").then(name => {
      if (!name) {
        name = defaultName;
      }

      let session = new Session(name);
      this.sessionResource.createSession(session).subscribe((sessionId: string) => {
        session.sessionId = sessionId;
        this.openSession(sessionId)
      }, (error: any) => {
        this.errorHandlerService.handleError(error, "Creating a new session failed");
      });
    }, () => {
      // modal dismissed
    });
  }

  updateSessions() {

    this.sessionResource.getSessions().subscribe((sessions: Session[]) => {

      let sessionsByUser = new Map();
      // show user's own sessions first
      sessionsByUser.set(null, []);

      sessions.forEach(s => {
        this.sessionDataService.getApplicableRules(s.rules).forEach(rule => {
          if (!sessionsByUser.has(rule.sharedBy)) {
            sessionsByUser.set(rule.sharedBy, []);
          }
          // show each session only once in each list, otherwise example_session_owner will see duplicates
          if (sessionsByUser.get(rule.sharedBy).map(s => s.sessionId).indexOf(s.sessionId) === -1) {
            sessionsByUser.get(rule.sharedBy).push(s);
          }
        });
      });

      this.sessionsByUser = sessionsByUser;
      this.sessionsByUserKeys = Array.from(sessionsByUser.keys());
    }, (error: any) => {
      this.errorHandlerService.handleError(error, "Loading sessions failed");
    });
  }

  openSession(sessionId: string) {
    this.previewThrottleSubscription.unsubscribe();
    this.selectedSessionId = sessionId;
    this.router.navigate(['/sessions', sessionId]);
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

    this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + session.name + '?', 'Delete', 'Cancel').then(() => {
      //this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
      // delete the session only from this user (i.e. the rule)
      this.sessionDataService.deletePersonalRules(session).subscribe( () => {
        this.updateSessions();
        this.previewedSession = null;
      }, (error: any) => {
        this.errorHandlerService.handleError(error, "Deleting session failed");
      });
    }, () => {
      // modal dismissed
    });
  }

  isSessionSelected(session: Session) {
    return this.selectedSessionId === session.sessionId;
  }
}
