
import SessionResource from "../../resources/session.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../resources/session.resource";

class SessionListController {

    static $inject = ['$location', 'SessionResource'];

    public selectedSession: Session;
    public selectedSessions: Session[];
    public previousSession: Session;
    public userSession: Session;
    public userSessions: Session[];
    public sessionData: SessionData;

    constructor(private $location:ng.ILocationService, private sessionResource:SessionResource) {
        this.updateSessions();
    }

    createSession() {

        let session = new Session('New session');
        this.sessionResource.createSession(session).then((sessionId: string) => {
                session.sessionId = sessionId;
                this.openSession(session);
        });
    }

    updateSessions() {

        this.sessionResource.getSessions().then((sessions: Session[]) => {
            this.userSessions = sessions;
            console.log(this.userSessions);
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
                this.sessionResource.loadSession(this.selectedSessions[0].sessionId).then((fullSession: SessionData) => {
                    // don't show if the selection has already changed
                    if (this.selectedSessions[0] === session) {
                        this.sessionData = fullSession;
                    }
                });
            }
        }
    }

    deleteSessions(sessions: Session[]) {
        sessions.forEach((session: Session) => {
            this.sessionResource.deleteSession(session.sessionId).then((res: any) => {
                console.log("session deleted", res);
                this.updateSessions();
                this.selectedSessions = [];
            });
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

export default {
    controller: SessionListController,
    templateUrl: 'app/views/sessions/sessionlist.html'
}