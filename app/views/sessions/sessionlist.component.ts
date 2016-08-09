
import SessionResource from "../../resources/session.resource";

class SessionListController {

    static $inject = ['$location', 'SessionResource'];

    public selectedSession:Array;
    public selectedSessions:Array;
    public previousSession:{};
    public userSession:Array;
    public userSessions:Array;
    public session:{};

    constructor(private $location:ng.ILocationService, private sessionResource:SessionResource) {
        this.updateSessions();
    }

    createSession() {

        let session = {
            sessionId: null,
            name: 'New session',
            notes: '',
            created: '2015-08-27T17:53:10.331Z',
            accessed: '2015-08-27T17:53:10.331Z'
        };

        this.sessionResource.service.one('sessions').customPOST(session).then((res) => {
            if (res.headers) {
                var sessionLocation = res.headers('Location');
                session.sessionId = sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
                this.openSession(session);
            }
        });
    };

    updateSessions() {

        this.sessionResource.service.all('sessions').getList().then((res) => {
            this.userSessions = res.data;
            console.log(this.userSessions);
        }, function (response) {
            console.log('failed to get sessions', response);
            if (response.status === 403) {
                this.$location.path('/login');
            }
        }.bind(this));
    };

    openSession(session) {
        this.$location.path("/sessions" + "/" + session.sessionId);
    };

    selectSession(event, session) {

        this.selectedSessions = [session];

        if (this.selectedSessions.length === 1) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.session = {};
                this.sessionResource.loadSession(this.selectedSessions[0].sessionId).then((fullSession) => {
                    // don't show if the selection has already changed
                    if (this.selectedSessions[0] === session) {
                        this.session = this.sessionResource.parseSessionData(fullSession);
                    }
                });
            }
        }
    };

    deleteSessions(sessions) {
        angular.forEach(sessions, (session) => {
            var sessionUrl = this.sessionResource.service.one('sessions').one(session.sessionId);
            sessionUrl.remove().then((res) => {
                console.log("session deleted", res);
                this.updateSessions();
                this.selectedSessions = [];
            });
        });
    };

    isSessionSelected(session) {
        return this.selectedSessions.indexOf(session) !== -1;
    };

    getWorkflowCallback() {
        return {
            isSelectedDataset: function () {
            },
            isSelectedJob: function () {
            }
        };
    };

}

export default {
    controller: SessionListController,
    templateUrl: 'app/views/sessions/sessionlist.html'
}