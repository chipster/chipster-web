import AuthenticationService from "../../../core/authentication/authenticationservice";
import ConfigService from "../../../shared/services/config.service";
import SessionResource from "../../../shared/resources/session.resource";
import IWebSocket = angular.websocket.IWebSocket;
import Session from "../../../model/session/session";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import * as _ from "lodash";
import {Injectable, Inject} from "@angular/core";
import {TokenService} from "../../../core/authentication/token.service";
import {SessionData} from "../../../model/session/session-data";

@Injectable()
export default class SessionEventService {

    ws: any;

    constructor(private configService: ConfigService,
                private tokenService: TokenService,
                @Inject('$websocket') private $websocket: ng.websocket.IWebSocketProvider,
                @Inject('SessionResource') private sessionResource: SessionResource){
    }

    subscribe(sessionId: string, sessionData: SessionData, onChange: any) {

        // creating a websocket object and start listening for the
        // events

        return this.configService.getSessionDbEventsUrl(sessionId).toPromise().then((eventUrl) => {

            console.debug('eventUrl', eventUrl);
            this.ws = this.$websocket(URI(eventUrl).addSearch('token', this.tokenService.getToken()).toString());

            this.ws.onOpen(() => {
                console.info('websocket connected')
            });

            this.ws.onMessage((event: any) => {
                this.handleEvent(JSON.parse(event.data), sessionId, sessionData, onChange);
            });


            this.ws.onClose(() => {
                console.info('websocket closed')
            });

            return {
                unsubscribe: () => {
                    this.ws.close();
                }
            }
        });
    }

    handleEvent(event: any, sessionId: string, sessionData: SessionData, onChange: any) {

        console.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, sessionData, onChange);

        } else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionId, sessionData, onChange);

        } else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionId, sessionData, onChange);

        } else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionId, sessionData, onChange);

        } else {
            console.warn("unknwon resource type", event.resourceType, event);
        }
    }

    handleAuthorizationEvent(event: any, sessionData: SessionData, onChange: any) {
        if (event.type === 'DELETE') {
            onChange(event, sessionData.session, null);

        } else {
            console.warn("unknown event type", event);
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
            console.warn("unknown event type", event);
        }
    }

    handleDatasetEvent(event: any, sessionId: string, sessionData: SessionData, onChange: any) {
        if (event.type === 'CREATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).subscribe((dataset: Dataset) => {
                sessionData.datasetsMap.set(event.resourceId, dataset);
                onChange(event, null, dataset);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).subscribe((dataset: Dataset) => {
                var local = sessionData.datasetsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);

                // update the original instance
                local = _.cloneDeep(dataset);
                onChange(event, localCopy, dataset);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.datasetsMap.get(event.resourceId));
            sessionData.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            console.warn("unknown event type", event);
        }
    }

    handleJobEvent(event: any, sessionId: any, sessionData: SessionData, onChange: any) {

        if (event.type === 'CREATE') {
            this.sessionResource.getJob(sessionId, event.resourceId).subscribe((job: Job) => {
                sessionData.jobsMap.set(event.resourceId, job);
                onChange(event, null, job);
            });

        } else if (event.type === 'UPDATE') {
            this.sessionResource.getJob(sessionId, event.resourceId).subscribe((job: Job) => {
                var local = sessionData.jobsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);

                // update the original instance
                local = _.cloneDeep(job);
                onChange(event, localCopy, job);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.jobsMap.get(event.resourceId));
            sessionData.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            console.warn("unknown event type", event.type, event);
        }
    }
}
