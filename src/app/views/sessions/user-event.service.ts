import { SessionResource } from "../../shared/resources/session.resource";
import {
  WsEvent,
  Session,
  Resource,
  EventType
} from "chipster-js-common";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { WebSocketSubject } from "rxjs/observable/dom/WebSocketSubject";
import log from "loglevel";
import { WebSocketService } from "../../shared/services/websocket.service";
import { UserEventData } from "./user-event-data";
import { SessionDataService } from "./session/session-data.service";
import { mergeMap } from "rxjs/operators";
import { of } from "rxjs";
import { SessionEventService } from "./session/session-event.service";

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
  ) { }

  unsubscribe() {
    this.webSocketService.unsubscribe();
  }

  connect(topic: string, userEventData: UserEventData) {
    this.topic = topic;

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.publish().refCount();

    this.webSocketService.connect(this.localSubject$, topic);

    this.ruleStream$ = stream
      .filter(wsData => wsData.resourceType === Resource.Rule)
      .flatMap(data => this.handleRuleEvent(data, data.sessionId, userEventData))
      .publish()
      .refCount();

    // update userEventData even if no one else subscribes
    this.ruleStream$
      .subscribe();
  }

  getRuleStream() {
    return this.ruleStream$;
  }


  /**
   * Apply rule change events in this session and return an observable that sends an event on changes
   */
  applyRuleStreamOfSession(session: Session) {
    return this.getRuleStream().pipe(
      mergeMap(wsEvent => {
        // sessionEventService can update individual sessions, let's reuse that
        return this.sessionEventService.handleRuleEvent(wsEvent, session);
      }),
    );
  }

  /**
   * Update the userEventData according to events
   *
   * THe original event is sent when the updates are done.
   */
  handleRuleEvent(event: any, sessionId: any, userEventData: UserEventData): Observable<WsEvent> {
    log.info('handleRuleEvent()', event);
    if (event.type === EventType.Create) {
      // new session was shared to us or a rule was added to the session we already have
      return this.sessionResource.getSession(sessionId)
        .map((session: Session) => {
          // get the session or latest rules
          userEventData.sessions.set(session.sessionId, session);
          return event;
        });
    } else if (event.type === EventType.Update) {
      return this.sessionResource.getSession(sessionId)
          .map((session: Session) => {
            log.info('rule updated', session.name);
            userEventData.sessions.set(session.sessionId, session);
            return event;
          });
    } else if (event.type === EventType.Delete) {

      const oldSession = userEventData.sessions.get(sessionId);
      const rule = oldSession.rules.find(r => r.ruleId === event.resourceId);
      const newRules = oldSession.rules.filter(r => r.ruleId !== event.resourceId);

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

    } else {
      console.warn("unknown event type", event);
      return of(event);
    }
  }
}
