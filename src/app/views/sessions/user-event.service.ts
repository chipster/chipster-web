import { Injectable } from "@angular/core";
import { EventType, Resource, Session, WsEvent } from "chipster-js-common";
import log from "loglevel";
import { Observable, of, Subject } from "rxjs";
import { filter, map, mergeMap, publish, refCount } from "rxjs/operators";
import { WebSocketSubject } from "rxjs/webSocket";
import { ErrorService } from "../../core/errorhandler/error.service";
import { SessionResource } from "../../shared/resources/session.resource";
import { WebSocketService } from "../../shared/services/websocket.service";
import { SessionDataService } from "./session/session-data.service";
import { SessionEventService } from "./session/session-event.service";
import { UserEventData } from "./user-event-data";

@Injectable()
export class UserEventService {
  topic: string;

  ruleStream$: Observable<WsEvent>;
  wsSubject$: WebSocketSubject<WsEvent>;
  localSubject$: Subject<WsEvent>;
  userEventData: UserEventData;

  constructor(
    private sessionResource: SessionResource,
    private webSocketService: WebSocketService,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService
  ) {}

  unsubscribe() {
    this.webSocketService.unsubscribe();
  }

  connect(topic: string, userEventData: UserEventData) {
    this.topic = topic;

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.pipe(publish(), refCount());

    // encode the user event topic twice (the second round is done in WebsocketService) to pass
    // the Jetty WebSocketUpgradeFilter when there is a slash in the topic name
    const encodedTopic = encodeURIComponent(topic);

    this.webSocketService.connect(this.localSubject$, encodedTopic);

    this.ruleStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Rule),
      mergeMap((data) => this.handleRuleEvent(data, data.sessionId, userEventData)),
      publish(),
      refCount()
    );

    // update userEventData even if no one else subscribes
    this.ruleStream$.subscribe(null, (err) => this.errorService.showError("error in rule events", err));
  }

  getRuleStream() {
    return this.ruleStream$;
  }

  /**
   * Apply rule change events in this session and return an observable that sends an event on changes
   */
  applyRuleStreamOfSession(session: Session) {
    return this.getRuleStream().pipe(
      mergeMap((wsEvent) => 
        // sessionEventService can update individual sessions, let's reuse that
         this.sessionEventService.handleRuleEvent(wsEvent, session)
      )
    );
  }

  /**
   * Update the userEventData according to events
   *
   * THe original event is sent when the updates are done.
   */
  handleRuleEvent(event: any, sessionId: any, userEventData: UserEventData): Observable<WsEvent> {
    log.info("handleRuleEvent()", event);
    if (event.type === EventType.Create) {
      // new session was shared to us or a rule was added to the session we already have
      return this.sessionResource.getSession(sessionId).pipe(
        map((session: Session) => {
          // get the session or latest rules
          userEventData.sessions.set(session.sessionId, session);
          return event;
        })
      );
    } if (event.type === EventType.Update) {
      return this.sessionResource.getSession(sessionId).pipe(
        map((session: Session) => {
          log.info("rule updated", session.name);
          userEventData.sessions.set(session.sessionId, session);
          return event;
        })
      );
    } if (event.type === EventType.Delete) {
      const oldSession = userEventData.sessions.get(sessionId);
      const rule = oldSession.rules.find((r) => r.ruleId === event.resourceId);
      const newRules = oldSession.rules.filter((r) => r.ruleId !== event.resourceId);

      log.info("rule deleted", oldSession, rule, newRules, this.sessionDataService.getApplicableRules(newRules));

      // check if we should still see this session
      if (this.sessionDataService.getApplicableRules(newRules).length > 0) {
        // the session should remain visible, remove only the rule
        userEventData.sessions.get(sessionId).rules = newRules;
      } else {
        // we shouldn't see the session anymore, remove the whole session
        userEventData.sessions.delete(sessionId);
      }
      return of(event);
    } 
      console.warn("unknown event type", event);
      return of(event);
    
  }
}
