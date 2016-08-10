import AuthenticationService from "../../../authentication/authenticationservice";
import ConfigService from "../../../services/config.service";
import SessionResource from "../../../resources/session.resource";
import IWebSocket = angular.websocket.IWebSocket;
import ILogService = angular.ILogService;
import SessionDataService from "./sessiondata.service";

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

        var eventUrl = this.configService.getSessionDbEventsUrl(sessionId);

        this.$log.debug('eventUrl', eventUrl);
        this.ws = this.$websocket(new URI(eventUrl).addQuery('token', this.authenticationService.getToken()).toString());

        this.ws.onOpen( () => { this.$log.info('websocket connected') });

        this.ws.onMessage( (event: any) => {
            this.handleEvent(JSON.parse(event.data), sessionId, localData, onChange);
        });

        this.ws.onClose( () => { this.$log.info('websocket closed') });

        return {
            unsubscribe: () => {
                this.ws.close();
            }
        }
    }

    handleEvent(event: any, sessionId: string, data: SessionDataService, onChange: any) {

        var sessionUrl = this.sessionResource.service.one('sessions', sessionId);

        this.$log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, data, onChange);

        } else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionUrl, data, onChange);

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

    handleSessionEvent(event: any, sessionUrl:any, data: SessionDataService, onChange: any) {
        if (event.type === 'UPDATE') {
            sessionUrl.get().then( (resp: any) => {
                var local = data.session;
                var localCopy = angular.copy(local);
                var remote = resp.data;

                // update the original instance
                angular.copy(remote, local);

                onChange(event, localCopy, remote);
            });

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleDatasetEvent(event: any, sessionUrl: any, data: SessionDataService, onChange: any) {
        if (event.type === 'CREATE') {
            sessionUrl.one('datasets', event.resourceId).get().then( (resp: any) => {
                data.datasetsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });

        } else if (event.type === 'UPDATE') {
            sessionUrl.one('datasets', event.resourceId).get().then( (resp: any) => {

                var local = data.datasetsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;

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

    handleJobEvent(event: any, sessionUrl: any, data: SessionDataService, onChange: any) {
        if (event.type === 'CREATE') {
            sessionUrl.one('jobs', event.resourceId).get().then( (resp: any) => {
                data.jobsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });

        } else if (event.type === 'UPDATE') {
            sessionUrl.one('jobs', event.resourceId).get().then( (resp: any) => {
                var local = data.jobsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;

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
