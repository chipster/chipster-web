
import {SessionResource} from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DialogModalService} from "./session/dialogmodal/dialogmodal.service";

@Component({
  selector: 'ch-session-list',
  templateUrl: './sessionlist.html',
  styleUrls: ['./sessionlist.less']
})
export class SessionListComponent {

    public selectedSessions: Session[];
    public previousSession: Session;
    public userSessions: Session[];
    public sessionData: SessionData;

    constructor(
        private router: Router,
        private sessionResource: SessionResource,
        private dialogModalService: DialogModalService) {}

    ngOnInit() {
      this.selectedSessions = [];
      this.updateSessions();
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
      this.router.navigate(['/sessions', sessionId]);
    }

    selectSession(event: any, session: Session) {
        this.selectedSessions = [session];

        if (this.selectedSessions.length === 1) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.sessionData = null;
                this.sessionResource.loadSession(this.selectedSessions[0].sessionId).subscribe((fullSession: SessionData) => {
                    // don't show if the selection has already changed
                    if (this.selectedSessions[0] === session) {
                        this.sessionData = fullSession;
                    }
                });
            }
        }
    }

    deleteSession(session: Session) {

      this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + session.name + '?', 'Delete', 'Cancel').then(() => {
        this.sessionResource.deleteSession(session.sessionId).subscribe( (response: any) => {
          this.updateSessions();
          this.selectedSessions.length = 0;
        }, () => {
          console.error('Error in deleting session');
        });
      }, () => {
        // modal dismissed
      });
    }

    isSessionSelected(session: Session) {
        return this.selectedSessions.indexOf(session) !== -1;
    }
}
