
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";
import {Subject} from "rxjs";
import {TokenService} from "../../core/authentication/token.service";
import Rule from "../../model/session/rule";
import {ErrorHandlerService} from "../../core/errorhandler/error-handler.service";
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

  private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

  constructor(
    private router: Router,
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private tokenService: TokenService,
    private errorHandlerService: ErrorHandlerService,
    private sessionDataService: SessionDataService) {}


  ngOnInit() {
    this.updateSessions();

    this.previewThrottleSubscription = this.previewThrottle$.asObservable()
    // hide the loading indicator of the old session immediately
      .do(() => this.workflowPreviewLoading = false)
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
      .subscribe();
  }

  createSession() {

    let session = new Session('New session');
    this.sessionResource.createSession(session).subscribe((sessionId: string) => {
      session.sessionId = sessionId;
      this.openSession(sessionId);
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
    }, error => {
      console.log("getting sessions list failed", error);
      this.errorHandlerService.redirectToLoginPage();
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

  deleteSession(session: Session) {

    this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + session.name + '?', 'Delete', 'Cancel').then(() => {
      //this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
      // delete the session only from this user (i.e. the rule)
      this.sessionDataService.deletePersonalRules(session).subscribe( () => {
        this.updateSessions();
        this.previewedSession = null;
      }, () => {
        console.error('Error in deleting session');
      });
    }, () => {
      // modal dismissed
    });
  }

  isSessionSelected(session: Session) {
    return this.selectedSessionId === session.sessionId;
  }
}
