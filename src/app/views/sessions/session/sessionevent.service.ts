import ConfigService from "../../../shared/services/config.service";
import SessionResource from "../../../shared/resources/session.resource";
import Session from "../../../model/session/session";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {Injectable, Inject} from "@angular/core";
import {TokenService} from "../../../core/authentication/token.service";
import {SessionData} from "../../../model/session/session-data";
import {Observable, Subject} from "rxjs";
import SessionEvent from "../../../model/events/sessionevent";
import {WebSocketSubject} from "rxjs/observable/dom/WebSocketSubject";
import WsEvent from "../../../model/events/wsevent";

@Injectable()
export default class SessionEventService {

    ws: any;

    sessionData: SessionData;
    sessionId: string;

    datasetStream$: Observable<SessionEvent>;
    jobStream$: Observable<SessionEvent>;
    sessionStream$: Observable<SessionEvent>;
    authorizationStream$: Observable<SessionEvent>;
    wsSubject$: WebSocketSubject<string>;
    localSubject$: Subject<string>;

    constructor(private configService: ConfigService,
                private tokenService: TokenService,
                @Inject('SessionResource') private sessionResource: SessionResource){
    }

    unsubscribe() {
        this.wsSubject$.unsubscribe();
    }

    setSessionData(sessionId: string, sessionData: SessionData) {

      this.sessionData = sessionData;
      this.sessionId = sessionId;

      let wsStream = this.getWsStream();
      this.localSubject$ = new Subject();

      let stream = wsStream.merge(this.localSubject$)
        // some debug prints
        .map(wsData => {
          console.log('websocket event', wsData);
          return wsData;

        }).catch((err, source) => {
          console.log('websocket error', err, source);
          return Observable.throw(err);

        }).finally(() => {
          console.info('websocket closed');
        }).publish().refCount();

      this.datasetStream$ = stream
        .filter(wsData => wsData.resourceType === 'DATASET')
        .flatMap(data => this.handleDatasetEvent(data, this.sessionId, this.sessionData))
        .publish().refCount();

      this.jobStream$ = stream
        .filter(wsData => wsData.resourceType === 'JOB')
        .flatMap(data => this.handleJobEvent(data, this.sessionId, this.sessionData))
        .publish().refCount();

      this.sessionStream$ = stream
        .filter(wsData => wsData.resourceType === 'SESSION')
        .flatMap(data => this.handleSessionEvent(data, this.sessionId, this.sessionData))
        .publish().refCount();

      this.authorizationStream$ = stream
        .filter(wsData => wsData.resourceType === 'AUTHORIZATION')
        .flatMap(data => this.handleAuthorizationEvent(data, this.sessionData))
        .publish().refCount();

      // update sessionData even if no one else subscribes
      this.datasetStream$.subscribe();
      this.jobStream$.subscribe();
      this.sessionStream$.subscribe();
      this.authorizationStream$.subscribe();
    }

    getWsStream() {
      // get the url of the websocket server
      return this.configService.getSessionDbEventsUrl(this.sessionId).flatMap( (eventsUrl:string) => {

        let wsUrl = `${eventsUrl}/events/${this.sessionId}?token=${this.tokenService.getToken()}`;
        console.debug('event URL', wsUrl);

        // convert websocket to observable
        this.wsSubject$ = Observable.webSocket(wsUrl);

        return this.wsSubject$;

      });
    }

  /**
   * Update sessionData and create a stream of old and new values. The old values
   * are useful for detecting changes.
   *
   * @returns {Observable<SessionEvent>}
   */
  getDatasetStream() {
        return this.datasetStream$;
    }

    getJobStream() {
        return this.jobStream$;
    }

    getSessionStream() {
      return this.sessionStream$;
    }

    getAuthorizationStream() {
      return this.authorizationStream$;
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
           return this.sessionResource.getSession(sessionId).flatMap((remote: Session) => {
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

  /**
   * Handle a locally generated event just like the real events coming from the websocket.
   *
   * Through this the client can be tricked to show different state from the server. Obviously
   * should be used only for quick hacks.
   *
   * @param event
   */
  generateLocalEvent(event: WsEvent) {
    // incorrect typing? it really is an object, but the compiler wants a string
    this.localSubject$.next(<any>event);
  }
}
