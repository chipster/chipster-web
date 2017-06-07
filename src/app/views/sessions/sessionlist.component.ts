
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";
import {Subject, Observable} from "rxjs";

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

    private previewThrottle$ = new Subject();

    constructor(
        private router: Router,
        private sessionResource: SessionResource,
        private dialogModalService: DialogModalService) {}

    ngOnInit() {
      this.updateSessions();

      this.previewThrottle$.asObservable()
        .debounce(() => Observable.timer(500))
        .subscribe(this.previewWorkflow.bind(this));
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
      this.selectedSessionId = sessionId;
      this.router.navigate(['/sessions', sessionId]);
    }

    previewSession(event: any, session: Session) {
        this.previewedSession = session;

        if (this.previewedSession) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.sessionData = null;
                // hide the spinner even if we are still loading the previous
                // session, because the session won't be shown
                this.workflowPreviewLoading = false;
                this.previewThrottle$.next(session);
            }
        }
    }

    previewWorkflow(session: Session) {
      this.workflowPreviewLoading = true;
      this.sessionResource.loadSession(this.previewedSession.sessionId).subscribe((fullSession: SessionData) => {
        // don't show if the selection has already changed
        if (this.previewedSession === session) {
          this.sessionData = fullSession;
        }
        this.workflowPreviewLoading = false;
      }, (err) => {
        this.workflowPreviewLoading = false;
      });
    }

    deleteSession(session: Session) {

      this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + session.name + '?', 'Delete', 'Cancel').then(() => {
        this.sessionResource.deleteSession(session.sessionId).subscribe( (response: any) => {
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
