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
import {Observable, Subject, Observer} from "rxjs";
import SessionEvent from "../../../model/events/sessionevent";

@Injectable()
export default class SessionEventService {

    ws: any;

    sessionData: SessionData;
    sessionId: string;

    events: Observable<SessionEvent>;
    datasetStream: Observable<SessionEvent>;
    jobStream: Observable<SessionEvent>;
    sessionStream: Observable<SessionEvent>;
    authorizationStream: Observable<SessionEvent>;

    constructor(private configService: ConfigService,
                private tokenService: TokenService,
                @Inject('$websocket') private $websocket: ng.websocket.IWebSocketProvider,
                @Inject('SessionResource') private sessionResource: SessionResource){
    }

    setSessionData(sessionId: string, sessionData: SessionData) {

      this.sessionData = sessionData;
      this.sessionId = sessionId;

      // subscribe to all streams to make sure that sessionData is updated even
      // if there aren't other subscribers
      this.getDatasetStream().subscribe();
      this.getJobStream().subscribe();
      this.getSessionStream().subscribe();
      this.getAuthorizationStream().subscribe();
    }

    // https://medium.com/@lwojciechowski/websockets-with-angular2-and-rxjs-8b6c5be02fac#.vo2lmk83l
    private createWsObservable(url): Subject<MessageEvent> {
      let ws = new WebSocket(url);
      let observable = Observable.create(
        (obs: Observer<MessageEvent>) => {
          ws.onmessage = obs.next.bind(obs);
          ws.onerror = obs.error.bind(obs);
          ws.onclose = obs.complete.bind(obs);
          return ws.close.bind(ws);
        }
      );
      let observer = {
        next: (data: Object) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
          }
        },
      };
      return Subject.create(observer, observable);
    }

    getStream() {

      // keep the stream object so that refCount can do it's job
      if (!this.events) {

        // get the url of the websocket server
        this.events = this.configService.getSessionDbEventsUrl(this.sessionId).flatMap(eventUrl => {

          console.debug('event URL', eventUrl);
          // set token
          let wsUrl = URI(eventUrl).addSearch('token', this.tokenService.getToken()).toString();

          // convert websocket to observable
          return this.createWsObservable(wsUrl);

        }).map(wsEvent => {
          // parse JSON
          console.log('websocket event', JSON.parse(wsEvent.data));
          return JSON.parse(wsEvent.data);
        })
        // use the same websocket connection for all subscribers
        .publish().refCount();
      }

      // some debug prints
      return this.events.catch((err, source) => {
        console.log('websocket error', err, source);
        return Observable.throw(err);
      }).finally(() => {
        console.info('websocket closed');
      });
    }

  /**
   * Update sessionData and create a stream of old and new values. The old values
   * are useful for detecting changes.
   *
   * @returns {Observable<SessionEvent>}
   */
  getDatasetStream() {
        if (!this.datasetStream) {
          this.datasetStream = this.getStream()
            .filter(wsData => wsData.resourceType === 'DATASET')
            .flatMap(data => this.handleDatasetEvent(data, this.sessionId, this.sessionData))
            .publish().refCount();
        }
        return this.datasetStream;
    }

    getJobStream() {
        if (!this.jobStream) {
          this.jobStream = this.getStream()
            .filter(wsData => wsData.resourceType === 'JOB')
            .flatMap(data => this.handleJobEvent(data, this.sessionId, this.sessionData))
            .publish().refCount();
        }
        return this.jobStream;
    }

    getSessionStream() {
      if (!this.sessionStream) {
        this.sessionStream = this.getStream()
          .filter(wsData => wsData.resourceType === 'SESSION')
          .flatMap(data => this.handleSessionEvent(data, this.sessionId, this.sessionData))
          .publish().refCount();
      }
      return this.sessionStream;
    }

    getAuthorizationStream() {
      if (!this.authorizationStream) {
        this.authorizationStream = this.getStream()
          .filter(wsData => wsData.resourceType === 'AUTHORIZATION')
          .flatMap(data => this.handleAuthorizationEvent(data, this.sessionData))
          .publish().refCount();
      }
      return this.authorizationStream;
    }

    createEvent(event, oldValue, newValue) {
        return Observable.of(new SessionEvent(event, oldValue, newValue));
    }

    handleAuthorizationEvent(event: any, sessionData: SessionData): Observable<SessionEvent> {
        if (event.type === 'DELETE') {
            return this.createEvent(event, sessionData.session, null);

        } else {
            console.warn("unknown event type", event);
        }
    }

    handleSessionEvent(event: any, sessionId:any, sessionData: SessionData): Observable<SessionEvent> {
        if (event.type === 'UPDATE') {
            return this.sessionResource.getSession(sessionId).then((remote: Session) => {
                var local = sessionData.session;
                sessionData.session = remote;
                return this.createEvent(event, local, remote);
            });

        } else {
            console.warn("unknown event type", event);
        }
    }

    handleDatasetEvent(event: any, sessionId: string, sessionData: SessionData): Observable<SessionEvent> {

        if (event.type === 'CREATE') {
            return this.sessionResource.getDataset(sessionId, event.resourceId).flatMap((remote: Dataset) => {
                sessionData.datasetsMap.set(event.resourceId, remote);
                return this.createEvent(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            return this.sessionResource.getDataset(sessionId, event.resourceId)
              .flatMap((remote: Dataset) => {
                var local = sessionData.datasetsMap.get(event.resourceId);
                sessionData.datasetsMap.set(event.resourceId, remote);
                return this.createEvent(event, local, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = sessionData.datasetsMap.get(event.resourceId);
            sessionData.datasetsMap.delete(event.resourceId);
            return this.createEvent(event, localCopy, null);

        } else {
            console.warn("unknown event type", event);
        }
    }

    handleJobEvent(event: any, sessionId: any, sessionData: SessionData): Observable<SessionEvent> {
        if (event.type === 'CREATE') {
            return this.sessionResource.getJob(sessionId, event.resourceId).flatMap((remote: Job) => {
                sessionData.jobsMap.set(event.resourceId, remote);
                return this.createEvent(event, null, remote);
            });

        } else if (event.type === 'UPDATE') {
            return this.sessionResource.getJob(sessionId, event.resourceId).flatMap((remote: Job) => {
                var local = sessionData.jobsMap.get(event.resourceId);
                sessionData.jobsMap.set(event.resourceId, remote);
                return this.createEvent(event, local, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = sessionData.jobsMap.get(event.resourceId);
            sessionData.jobsMap.delete(event.resourceId);
            return this.createEvent(event, localCopy, null);

        } else {
            console.warn("unknown event type", event.type, event);
        }
    }
}
