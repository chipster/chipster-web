import { ConfigService } from "../../../shared/services/config.service";
import { SessionResource } from "../../../shared/resources/session.resource";
import {
  Session,
  Dataset,
  Job,
  Rule,
  WsEvent,
  SessionEvent
} from "chipster-js-common";
import { Injectable } from "@angular/core";
import { TokenService } from "../../../core/authentication/token.service";
import { SessionData } from "../../../model/session/session-data";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { WebSocketSubject } from "rxjs/observable/dom/WebSocketSubject";
import { ErrorService } from "../../../core/errorhandler/error.service";
import log from "loglevel";

@Injectable()
export class SessionEventService {
  sessionId: string;

  datasetStream$: Observable<SessionEvent>;
  jobStream$: Observable<SessionEvent>;
  sessionStream$: Observable<SessionEvent>;
  ruleStream$: Observable<SessionEvent>;
  wsSubject$: WebSocketSubject<WsEvent>;
  localSubject$: Subject<WsEvent>;

  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
    private sessionResource: SessionResource,
    private errorService: ErrorService
  ) {}

  unsubscribe() {
    // can be null when session loading fails (e.g. expired token)
    if (this.wsSubject$) {
      this.wsSubject$.unsubscribe();
    }
    // sessionId is used as a flag for cancelling the reconnection
    this.sessionId = null;
  }

  setSessionData(sessionId: string, sessionData: SessionData) {
    this.sessionId = sessionId;

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.publish().refCount();

    this.connect(this.localSubject$);

    this.datasetStream$ = stream
      .filter(wsData => wsData.resourceType === "DATASET")
      .flatMap(data =>
        this.handleDatasetEvent(data, this.sessionId, sessionData)
      )
      // update type tags before letting other parts of the client know about this change
      .flatMap(sessionEvent =>
        this.updateTypeTags(this.sessionId, sessionEvent, sessionData)
      )
      .publish()
      .refCount();

    this.jobStream$ = stream
      .filter(wsData => wsData.resourceType === "JOB")
      .flatMap(data => this.handleJobEvent(data, this.sessionId, sessionData))
      .publish()
      .refCount();

    this.sessionStream$ = stream
      .filter(wsData => wsData.resourceType === "SESSION")
      .flatMap(data =>
        this.handleSessionEvent(data, this.sessionId, sessionData)
      )
      .publish()
      .refCount();

    this.ruleStream$ = stream
      .filter(wsData => wsData.resourceType === "RULE")
      .flatMap(data => this.handleRuleEvent(data, this.sessionId, sessionData))
      .publish()
      .refCount();

    // update sessionData even if no one else subscribes
    this.datasetStream$.subscribe();
    this.jobStream$.subscribe();
    this.sessionStream$.subscribe();
    this.ruleStream$.subscribe();
  }

  /**
   * Connect to websocket and copy events to the listener Subject
   *
   * There are two Subjects, the listener Subject and
   * the real websocket Subject. The listener Subject collects the subscriptions, while the websocket
   * Subject is kept hidden behing the scenes. All received websocket messages are pushed to the listener
   * Subject. When the websocket Subject completes beause of the server's
   * idle timeout, we can simply create a new websocket Subject, without loosing the current subscriptions.
   */
  connect(listener) {
    // get the url of the websocket server
    this.configService
      .getSessionDbEventsUrl(this.sessionId)
      .flatMap((eventsUrl: string) => {
        const wsUrl = `${eventsUrl}/events/${
          this.sessionId
        }?token=${this.tokenService.getToken()}`;
        log.debug("event URL", wsUrl);

        // convert websocket to observable
        this.wsSubject$ = Observable.webSocket({
          url: wsUrl,
          openObserver: {
            next: x => {
              log.info("websocket open", x);
            }
          }
        });

        return this.wsSubject$;
      })
      // convert unclean idle timeouts to clean (about 20% of them for unknown reason)
      .catch(err => {
        if (err.code === 1001 && err.reason === "Idle Timeout") {
          return Observable.empty();
        } else {
          return Observable.throw(err);
        }
      })
      .subscribe(
        data => {
          log.info("websocket event", data);
          listener.next(data);
        },
        err => {
          log.info("websocket error", err);
          this.errorService.headerError(
            "Connection lost, please reload page.",
            false
          );
        },
        () => {
          log.info("websocket closed");
          // if not unsubscribed
          if (this.sessionId) {
            // reconnect after clean close (server idle timeout)
            this.connect(listener);
          }
        }
      );
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

  getRuleStream() {
    return this.ruleStream$;
  }

  createEvent(event, oldValue, newValue) {
    return Observable.of(new SessionEvent(event, oldValue, newValue));
  }

  handleRuleEvent(
    event: any,
    sessionId: any,
    sessionData: SessionData
  ): Observable<SessionEvent> {
    if (event.type === "CREATE") {
      return this.sessionResource
        .getRule(sessionId, event.resourceId)
        .flatMap((rule: Rule) => {
          sessionData.session.rules.push(rule);
          return this.createEvent(event, null, rule);
        });
    } else if (event.type === "DELETE") {
      const rule = sessionData.session.rules.find(
        r => r.ruleId === event.resourceId
      );
      sessionData.session.rules = sessionData.session.rules.filter(
        r => r.ruleId !== event.resourceId
      );
      return this.createEvent(event, rule, null);
    } else {
      console.warn("unknown event type", event);
    }
  }

  handleSessionEvent(
    event: any,
    sessionId: any,
    sessionData: SessionData
  ): Observable<SessionEvent> {
    if (event.type === "UPDATE") {
      return this.sessionResource
        .getSession(sessionId)
        .flatMap((remote: Session) => {
          const local = sessionData.session;
          sessionData.session = remote;
          return this.createEvent(event, local, remote);
        });
    } else {
      console.warn("unknown event type", event);
    }
  }

  handleDatasetEvent(
    event: any,
    sessionId: string,
    sessionData: SessionData
  ): Observable<SessionEvent> {
    if (event.type === "CREATE") {
      return this.sessionResource
        .getDataset(sessionId, event.resourceId)
        .flatMap((remote: Dataset) => {
          sessionData.datasetsMap.set(event.resourceId, remote);
          return this.createEvent(event, null, remote);
        });
    } else if (event.type === "UPDATE") {
      return this.sessionResource
        .getDataset(sessionId, event.resourceId)
        .flatMap((remote: Dataset) => {
          const local = sessionData.datasetsMap.get(event.resourceId);
          sessionData.datasetsMap.set(event.resourceId, remote);
          return this.createEvent(event, local, remote);
        });
    } else if (event.type === "DELETE") {
      const localCopy = sessionData.datasetsMap.get(event.resourceId);
      sessionData.datasetsMap.delete(event.resourceId);
      return this.createEvent(event, localCopy, null);
    } else {
      console.warn("unknown event type", event);
    }
  }

  updateTypeTags(sessionId, sessionEvent, sessionData) {
    // update type tags before
    const newValue = <Dataset>sessionEvent.newValue;

    if (newValue) {
      if (!newValue.fileId) {
        // dataset created, but fileId is missing
        // get type tags later when the fileId is added
        return Observable.of(sessionEvent);
      }

      // dataset created or updated, update type tags too
      return this.sessionResource
        .getTypeTagsForDataset(sessionId, newValue)
        .map(typeTags => {
          sessionData.datasetTypeTags.set(newValue.datasetId, typeTags);
          return sessionEvent;
        });
    } else {
      // dataset deleted, type tags can be removed
      sessionData.datasetTypeTags.delete(sessionEvent.resourceId);
      return Observable.of(sessionEvent);
    }
  }

  handleJobEvent(
    event: any,
    sessionId: any,
    sessionData: SessionData
  ): Observable<SessionEvent> {
    if (event.type === "CREATE") {
      return this.sessionResource
        .getJob(sessionId, event.resourceId)
        .flatMap((remote: Job) => {
          sessionData.jobsMap.set(event.resourceId, remote);
          return this.createEvent(event, null, remote);
        });
    } else if (event.type === "UPDATE") {
      return this.sessionResource
        .getJob(sessionId, event.resourceId)
        .flatMap((remote: Job) => {
          const local = sessionData.jobsMap.get(event.resourceId);
          sessionData.jobsMap.set(event.resourceId, remote);
          return this.createEvent(event, local, remote);
        });
    } else if (event.type === "DELETE") {
      const localCopy = sessionData.jobsMap.get(event.resourceId);
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
    this.localSubject$.next(event);
  }
}
