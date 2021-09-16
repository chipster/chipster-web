import { Injectable } from "@angular/core";
import {
  Dataset,
  EventType,
  Job,
  Resource,
  Rule,
  Session,
  SessionEvent,
  SessionState,
  WsEvent,
} from "chipster-js-common";
import log from "loglevel";
import { never as observableNever, Observable, of as observableOf, Subject } from "rxjs";
import { filter, map, mergeMap, publish, refCount } from "rxjs/operators";
import { WebSocketSubject } from "rxjs/webSocket";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { SessionData } from "../../../model/session/session-data";
import { SessionResource } from "../../../shared/resources/session.resource";
import { WebSocketService } from "../../../shared/services/websocket.service";
import { SelectionService } from "./selection.service";

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
    private websocketService: WebSocketService,
    private errorService: ErrorService,
    private selectionService: SelectionService
  ) {}

  unsubscribe() {
    this.websocketService.unsubscribe();
  }

  setSessionData(sessionId: string, sessionData: SessionData) {
    this.sessionHasChanged = false;
    this.sessionId = sessionId;

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.pipe(publish(), refCount());

    this.websocketService.connect(this.localSubject$, sessionId);

    // track any changes to session
    stream.subscribe(
      () => {
        this.sessionHasChanged = true;
      },
      (err) => this.errorService.showError("session change tracking failed", err)
    );

    this.datasetStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Dataset),
      mergeMap((data) => this.handleDatasetEvent(data, this.sessionId, sessionData)),
      // update type tags before letting other parts of the client know about this change
      mergeMap((sessionEvent) => this.updateTypeTags(this.sessionId, sessionEvent, sessionData)),
      publish(),
      refCount()
    );

    this.jobStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Job),
      mergeMap((data) => this.handleJobEvent(data, this.sessionId, sessionData)),
      publish(),
      refCount()
    );

    this.sessionStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Session),
      mergeMap((data) => this.handleSessionEvent(data, this.sessionId, sessionData)),
      publish(),
      refCount()
    );

    this.ruleStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Rule),
      mergeMap((data) => this.handleRuleEvent(data, sessionData.session)),
      publish(),
      refCount()
    );

    // update sessionData even if no one else subscribes
    this.datasetStream$.subscribe(null, (err) => this.errorService.showError("dataset event error", err));
    this.jobStream$.subscribe(null, (err) => this.errorService.showError("job event error", err));
    this.sessionStream$.subscribe(null, (err) => this.errorService.showError("session event error", err));
    this.ruleStream$.subscribe(null, (err) => this.errorService.showError("rule event error", err));
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

  getSelectedDatasetsContentsUpdatedStream(): Observable<string> {
    return this.getDatasetStream().pipe(
      filter(
        (sessionEvent) =>
          sessionEvent != null &&
          sessionEvent.event.type === EventType.Update &&
          sessionEvent.event.resourceType === Resource.Dataset &&
          this.selectionService.selectedDatasets.some(
            (selectedDataset) => selectedDataset.datasetId === (sessionEvent.newValue as Dataset).datasetId
          )
      ),
      map((sessionEvent) => (sessionEvent.newValue as Dataset).datasetId)
    );
  }

  createEvent(event, oldValue, newValue) {
    return observableOf(new SessionEvent(event, oldValue, newValue));
  }

  handleRuleEvent(event: any, session: Session): Observable<SessionEvent> {
    log.info("handle rule event", event, session);
    if (event.type === EventType.Create) {
      return this.sessionResource.getRule(session.sessionId, event.resourceId).pipe(
        mergeMap((rule: Rule) => {
          session.rules.push(rule);
          return this.createEvent(event, null, rule);
        })
      );
    } else if (event.type === EventType.Delete) {
      const rule = session.rules.find((r) => r.ruleId === event.resourceId);
      session.rules = session.rules.filter((r) => r.ruleId !== event.resourceId);
      return this.createEvent(event, rule, null);
    } else {
      log.warn("unknown event type", event);
    }
  }

  handleSessionEvent(event: any, sessionId: any, sessionData: SessionData): Observable<SessionEvent> {
    if (event.type === EventType.Update) {
      if (event.state !== SessionState.Delete) {
        return this.sessionResource.getSession(sessionId).pipe(
          mergeMap((remote: Session) => {
            const local = sessionData.session;
            sessionData.session = remote;
            log.info("session updated", remote.name, remote.state);
            return this.createEvent(event, local, remote);
          })
        );
      } else {
        // nothing to do, the client reacts when the Rule is deleted
        return observableNever();
      }
    } else if (event.type === EventType.Delete) {
      // nothing to do, the client reacts when the Rule is deleted
      return observableNever();
    } else {
      log.warn("unknown event type", event);
    }
  }

  handleDatasetEvent(event: any, sessionId: string, sessionData: SessionData): Observable<SessionEvent> {
    if (event.type === EventType.Create) {
      return this.sessionResource.getDataset(sessionId, event.resourceId).pipe(
        mergeMap((remote: Dataset) => {
          sessionData.datasetsMap.set(event.resourceId, remote);
          return this.createEvent(event, null, remote);
        })
      );
    } else if (event.type === EventType.Update) {
      return this.sessionResource.getDataset(sessionId, event.resourceId).pipe(
        mergeMap((remote: Dataset) => {
          const local = sessionData.datasetsMap.get(event.resourceId);
          sessionData.datasetsMap.set(event.resourceId, remote);
          return this.createEvent(event, local, remote);
        })
      );
    } else if (event.type === EventType.Delete) {
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
        return observableOf(sessionEvent);
      }

      // dataset created or updated, update type tags too
      return this.sessionResource.getTypeTagsForDataset(sessionId, newValue).pipe(
        map((typeTags) => {
          sessionData.datasetTypeTags.set(newValue.datasetId, typeTags);
          return sessionEvent;
        })
      );
    } else {
      // dataset deleted, type tags can be removed
      sessionData.datasetTypeTags.delete(sessionEvent.resourceId);
      return observableOf(sessionEvent);
    }
  }

  handleJobEvent(event: any, sessionId: any, sessionData: SessionData): Observable<SessionEvent> {
    if (event.type === EventType.Create) {
      return this.sessionResource.getJob(sessionId, event.resourceId).pipe(
        mergeMap((remote: Job) => {
          sessionData.jobsMap.set(event.resourceId, remote);
          return this.createEvent(event, null, remote);
        })
      );
    } else if (event.type === EventType.Update) {
      return this.sessionResource.getJob(sessionId, event.resourceId).pipe(
        mergeMap((remote: Job) => {
          const local = sessionData.jobsMap.get(event.resourceId);
          sessionData.jobsMap.set(event.resourceId, remote);
          return this.createEvent(event, local, remote);
        })
      );
    } else if (event.type === EventType.Delete) {
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
