
import SessionResource from "../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../shared/resources/sessionworker.resource";
import Session from "../../model/session/session";
import * as angular from 'angular';
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

    private isOpening = false;

    constructor(
        @Inject('$location') private $location:ng.ILocationService,
        private sessionResource:SessionResource,
        private sessionWorkerResource:SessionWorkerResource,
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

    openSessionFile(event: any) {
    	// why is the file dialog triggered twice every now and then without this?
    	event.stopImmediatePropagation();
		/*
		File dialog is opened by triggering a fake click event on the hidden file input.
		Browsers allow the file input to open only if this is called directly from some
		user generated event (like clicking a button).
		 */

        let input = document.getElementById('open-session-file-input');
        angular.element(input).trigger('click'); // open dialog
    }

    uploadSessionFile(event: any, files: any) {
        this.isOpening = true;
        let session = new Session('New session');
        return this.sessionResource.createSession(session).subscribe((sessionId: string) => {
            session.sessionId = sessionId;
            this.$uibModal.open({
                animation: true,
                templateUrl: './session/leftpanel/adddatasetmodal/adddatasetmodal.html',
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
                    },
                    oneFile: () => true,
                    files: () => files
                }
            }).result.then((datasets: string[]) => {
                console.log('session file uploaded');
                console.log('extract session');
                return this.sessionWorkerResource.extractSession(sessionId, datasets[0]).toPromise().then((warnings) => {
                    console.log('extracted, warnings: ', warnings);
                    return this.sessionResource.deleteDataset(sessionId, datasets[0]).toPromise();
                }).then((res) => {
                    console.log('uploaded session file deleted', res);
                    console.log('change view');
                    this.isOpening = false;
                    this.$scope.$apply(() => {
                        this.openSession(session);
                    });
                });
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
