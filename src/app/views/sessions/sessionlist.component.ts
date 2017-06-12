
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";
import {Subject} from "rxjs";

@Component({
  selector: 'ch-session-list',
  templateUrl: './sessionlist.html',
  styleUrls: ['./sessionlist.less']
})
export class SessionListComponent {

    public previewedSession: Session;
    public previousSession: Session;
    public userSessions: Session[];
    public sessionData: SessionData;
    private selectedSessionId: string;
    private workflowPreviewLoading = false;

    private previewThrottle$ = new Subject<Session>();
  private previewThrottleSubscription;

    constructor(
        private router: Router,
        private sessionResource: SessionResource,
        private dialogModalService: DialogModalService) {}

    ngOnInit() {
      this.updateSessions();

      this.previewThrottleSubscription = this.previewThrottle$.asObservable()
        // hide the loading indicator of the old session immediately
        .do(() => this.workflowPreviewLoading = false)
        // wait a while to see if the user is really intersted about this session
        .debounceTime(500)
        // in switchMap the new request cancels the previous requests
        .switchMap(session => {
          this.workflowPreviewLoading = true;
          return this.sessionResource.loadSession(session.sessionId)
        })
        .do((fullSession: SessionData) => {
          this.workflowPreviewLoading = false;
          // don't show if the selection has already changed
          if (this.previewedSession.sessionId === fullSession.session.sessionId) {
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
            this.userSessions = sessions;
        });
    }

    openSession(sessionId: string) {
      this.previewThrottleSubscription.unsubscribe();
      this.selectedSessionId = sessionId;
      this.router.navigate(['/sessions', sessionId]);
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
        this.sessionResource.deleteSession(session.sessionId).subscribe( () => {
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
