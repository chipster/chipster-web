
import SessionResource from "../../resources/session.resource";
import SessionWorkerResource from "../../resources/sessionworker.resource";
import Session from "../../model/session/session";
import {SessionData} from "../../resources/session.resource";

class SessionListController {

    static $inject = ['$location', 'SessionResource', '$uibModal', 'SessionWorkerResource'];

    public selectedSessions: Session[];
    public previousSession: Session;
    public userSessions: Session[];
    public sessionData: SessionData;

    constructor(
        private $location:ng.ILocationService,
        private sessionResource:SessionResource,
        private $uibModal: ng.ui.bootstrap.IModalService,
        private sessionWorkerResource:SessionWorkerResource) {

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

    openSessionFile() {
        let session = new Session('New session');
        this.sessionResource.createSession(session).then((sessionId: string) => {
            session.sessionId = sessionId;
            this.$uibModal.open({
                animation: true,
                templateUrl: 'app/views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.html',
                controller: 'AddDatasetModalController',
                controllerAs: 'vm',
                bindToController: true,
                size: 'lg',
                resolve: {
                    datasetsMap: () => {
                        return new Map();
                    },
                    sessionId: () => {
                        return sessionId;
                    }
                }
            }).result.then((datasets: string[]) => {
                this.openSession(session);
                console.log('extracting session');
                return this.sessionWorkerResource.extractSession(sessionId, datasets[0]);
            }).then((warnings) => {
                console.log('extracted, warnings: ', warnings);
            });
        });
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