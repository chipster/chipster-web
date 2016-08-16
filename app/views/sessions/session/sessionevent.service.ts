import AuthenticationService from "../../../authentication/authenticationservice";
import ConfigService from "../../../services/config.service";
import SessionResource from "../../../resources/session.resource";
import IWebSocket = angular.websocket.IWebSocket;
import ILogService = angular.ILogService;
import SessionDataService from "./sessiondata.service";
import Session from "../../../model/session/session";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";

export default class SessionEventService {

    static $inject = ['ConfigService', '$log', 'AuthenticationService', '$websocket', 'SessionResource'];

    ws: any;

    constructor(private configService: ConfigService,
                private $log: ILogService,
                private authenticationService: AuthenticationService,
                private $websocket: IWebSocket,
                private sessionResource: SessionResource){
    }

    subscribe(sessionId: string, localData: SessionDataService, onChange: any) {

        // creating a websocket object and start listening for the
        // events

        this.configService.getSessionDbEventsUrl(sessionId).then((eventUrl) => {

            this.$log.debug('eventUrl', eventUrl);
            this.ws = this.$websocket(new URI(eventUrl).addQuery('token', this.authenticationService.getToken()).toString());

            this.ws.onOpen(() => {
                this.$log.info('websocket connected')
            });

            this.ws.onMessage((event: any) => {
                this.handleEvent(JSON.parse(event.data), sessionId, localData, onChange);
            });

            this.ws.onClose(() => {
                this.$log.info('websocket closed')
            });

            return {
                unsubscribe: () => {
                    this.ws.close();
                }
            }
        });
    }

    handleEvent(event: any, sessionId: string, data: SessionDataService, onChange: any) {

        this.$log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, data, onChange);

        } else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionId, data, onChange);

        } else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionId, data, onChange);

        } else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionId, data, onChange);

        } else {
            this.$log.warn("unknwon resource type", event.resourceType, event);
        }
    }

    handleAuthorizationEvent(event: any, data: SessionDataService, onChange: any) {
        if (event.type === 'DELETE') {
            onChange(event, data.session, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleSessionEvent(event: any, sessionId:any, data: SessionDataService, onChange: any) {
        if (event.type === 'UPDATE') {
            this.sessionResource.getSession(sessionId).then((remote: Session) => {
                var local = data.session;
                var localCopy = angular.copy(local);

                // update the original instance
                angular.copy(remote, local);

                onChange(event, localCopy, remote);
            });

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleDatasetEvent(event: any, sessionId: string, data: SessionDataService, onChange: any) {
        if (event.type === 'CREATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then((remote: Dataset) => {
                data.datasetsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then((remote: Dataset) => {
                var local = data.datasetsMap.get(event.resourceId);
                var localCopy = angular.copy(local);

                // update the original instance
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.datasetsMap.get(event.resourceId));
            data.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleJobEvent(event: any, sessionId: any, data: SessionDataService, onChange: any) {
        if (event.type === 'CREATE') {
            this.sessionResource.getJob(sessionId, event.resourceId). then((remote: Job) => {
                data.jobsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getJob(sessionId, event.resourceId). then((remote: Job) => {
                var local = data.jobsMap.get(event.resourceId);
                var localCopy = angular.copy(local);

                // update the original instance
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.jobsMap.get(event.resourceId));
            data.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event.type, event);
        }
    }
}
