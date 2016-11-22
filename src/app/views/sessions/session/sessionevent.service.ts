import AuthenticationService from "../../../authentication/authenticationservice";
import ConfigService from "../../../services/config.service";
import SessionResource from "../../../resources/session.resource";
import IWebSocket = angular.websocket.IWebSocket;
import Session from "../../../model/session/session";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {SessionData} from "../../../resources/session.resource";
import * as _ from "lodash";

export default class SessionEventService {

    static $inject = ['ConfigService', '$log', 'AuthenticationService', '$websocket', 'SessionResource'];

    ws: any;

    constructor(private configService: ConfigService,
                private $log: ng.ILogService,
                private authenticationService: AuthenticationService,
                private $websocket: ng.websocket.IWebSocketProvider,
                private sessionResource: SessionResource){
    }

    subscribe(sessionId: string, sessionData: SessionData, onChange: any) {

        // creating a websocket object and start listening for the
        // events

        return this.configService.getSessionDbEventsUrl(sessionId).then((eventUrl) => {

            this.$log.debug('eventUrl', eventUrl);
            this.ws = this.$websocket(URI(eventUrl).addSearch('token', this.authenticationService.getToken()).toString());

            this.ws.onOpen(() => {
                this.$log.info('websocket connected')
            });

            this.ws.onMessage((event: any) => {
                this.handleEvent(JSON.parse(event.data), sessionId, sessionData, onChange);
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

    handleEvent(event: any, sessionId: string, sessionData: SessionData, onChange: any) {

        this.$log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, sessionData, onChange);

        } else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionId, sessionData, onChange);

        } else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionId, sessionData, onChange);

        } else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionId, sessionData, onChange);

        } else {
            this.$log.warn("unknwon resource type", event.resourceType, event);
        }
    }

    handleAuthorizationEvent(event: any, sessionData: SessionData, onChange: any) {
        if (event.type === 'DELETE') {
            onChange(event, sessionData.session, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleSessionEvent(event: any, sessionId:any, sessionData: SessionData, onChange: any) {
        if (event.type === 'UPDATE') {
            this.sessionResource.getSession(sessionId).then((remote: Session) => {
                var local = sessionData.session;
                var localCopy = _.cloneDeep(local);

                // update the original instance
                local = _.cloneDeep(remote);

                onChange(event, localCopy, remote);
            });

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleDatasetEvent(event: any, sessionId: string, sessionData: SessionData, onChange: any) {
        if (event.type === 'CREATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then((remote: Dataset) => {
                sessionData.datasetsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then((remote: Dataset) => {
                var local = sessionData.datasetsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);

                // update the original instance
                local = _.cloneDeep(remote);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.datasetsMap.get(event.resourceId));
            sessionData.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    }

    handleJobEvent(event: any, sessionId: any, sessionData: SessionData, onChange: any) {
        if (event.type === 'CREATE') {
            this.sessionResource.getJob(sessionId, event.resourceId). then((remote: Job) => {
                sessionData.jobsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getJob(sessionId, event.resourceId). then((remote: Job) => {
                var local = sessionData.jobsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);

                // update the original instance
                local = _.cloneDeep(remote);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.jobsMap.get(event.resourceId));
            sessionData.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event.type, event);
        }
    }
}
