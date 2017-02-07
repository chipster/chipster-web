
import SessionResource from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../model/session/session-data";
import {Component, Inject} from "@angular/core";

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
        @Inject('$location') private $location:ng.ILocationService,
        private sessionResource:SessionResource,
        @Inject('$scope') private $scope: ng.IScope) {}

    ngOnInit() {
      this.selectedSessions = [];
      this.updateSessions();
    }

    createSession() {

        let session = new Session('New session');
        this.sessionResource.createSession(session).subscribe((sessionId: string) => {
                session.sessionId = sessionId;
                this.openSession(session);
        });
    }

    updateSessions() {

        this.sessionResource.getSessions().subscribe((sessions: Session[]) => {
            this.userSessions = sessions;
        }, (response: any) => {
            console.log('failed to get sessions', response);
            if (response.status === 403) {
                this.$location.path('/login');
            }
        });
    }

    openSession(session: Session) {
        this.$location.path("/sessions" + "/" + session.sessionId);
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
      this.sessionResource.deleteSession(session.sessionId).subscribe( (response: any) => {
        this.updateSessions();
        this.selectedSessions.length = 0;
      }, () => {
        console.error('Error in deleting session');
      });
    }

    isSessionSelected(session: Session) {
        return this.selectedSessions.indexOf(session) !== -1;
    }

    getWorkflowCallback() {
        return {
            isSelectedDataset: function () {
            },
            isSelectedJob: function () {
            }
        };
    }
}
