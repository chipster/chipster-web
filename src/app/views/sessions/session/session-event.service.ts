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
import { SessionData } from "../../../model/session/session-data";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { WebSocketSubject } from "rxjs/observable/dom/WebSocketSubject";
import log from "loglevel";
import { WebSocketService } from "../../../shared/services/websocket.service";

@Injectable()
export class SessionEventService {
  sessionId: string;

  datasetStream$: Observable<SessionEvent>;
  jobStream$: Observable<SessionEvent>;
  sessionStream$: Observable<SessionEvent>;
  ruleStream$: Observable<SessionEvent>;
  wsSubject$: WebSocketSubject<WsEvent>;
  localSubject$: Subject<WsEvent>;

  sessionHasChanged = false;

  constructor(
    private sessionResource: SessionResource,
    private websocketService: WebSocketService
  ) {}

  unsubscribe() {
    this.websocketService.unsubscribe();
  }

  setSessionData(sessionId: string, sessionData: SessionData) {
    this.sessionHasChanged = false;
    this.sessionId = sessionId;

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.publish().refCount();

    this.websocketService.connect(
      this.localSubject$,
      sessionId
    );

    // track any changes to session
    stream.subscribe(() => {
      this.sessionHasChanged = true;
    });

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
      .flatMap(data => this.handleRuleEvent(data, sessionData.session))
      .publish()
      .refCount();

    // update sessionData even if no one else subscribes
    this.datasetStream$.subscribe();
    this.jobStream$.subscribe();
    this.sessionStream$.subscribe();
    this.ruleStream$.subscribe();
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

  handleRuleEvent(event: any, session: Session): Observable<SessionEvent> {
    log.info("handle rule event", event, session);
    if (event.type === "CREATE") {
      return this.sessionResource
        .getRule(session.sessionId, event.resourceId)
        .flatMap((rule: Rule) => {
          session.rules.push(rule);
          return this.createEvent(event, null, rule);
        });
    } else if (event.type === "DELETE") {
      const rule = session.rules.find(r => r.ruleId === event.resourceId);
      session.rules = session.rules.filter(r => r.ruleId !== event.resourceId);
      return this.createEvent(event, rule, null);
    } else {
      log.warn("unknown event type", event);
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
    } else if (event.type === "DELETE") {
      // nothing to do, the client reacts when the Rule is deleted
      return Observable.never();
    } else {
      log.warn("unknown event type", event);
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
      log.warn("unknown event type", event);
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
      log.warn("unknown event type", event.type, event);
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
