import { Injectable } from "@angular/core";
import { EventType, Resource, Session, WsEvent } from "chipster-js-common";
import log from "loglevel";
import { EMPTY, Observable, Subject, defer, of } from "rxjs";
import { catchError, filter, map, mergeMap, share, tap } from "rxjs/operators";
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

  /**
   * handleOrDrop() messages that are currently shown to the user, so that an ongoing
   * failure doesn't stack a new toast for every event. Cleared again when an event of
   * the same kind succeeds.
   */
  private reportedErrors = new Set<string>();

  constructor(
    private sessionResource: SessionResource,
    private webSocketService: WebSocketService,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private errorService: ErrorService,
  ) {}

  unsubscribe() {
    this.webSocketService.unsubscribe();
  }

  connect(topic: string, userEventData: UserEventData) {
    this.topic = topic;
    this.reportedErrors.clear();

    this.localSubject$ = new Subject();
    const stream = this.localSubject$.asObservable();

    this.webSocketService.connect(this.localSubject$, "users/" + topic);

    this.ruleStream$ = stream.pipe(
      filter((wsData) => wsData.resourceType === Resource.Rule),
      mergeMap((data) =>
        this.handleOrDrop("error in rule events", () => this.handleRuleEvent(data, data.sessionId, userEventData)),
      ),
      share(),
    );

    // update userEventData even if no one else subscribes. handleOrDrop() reports the
    // failures of individual events, but report also if the stream itself errors, because
    // then it stops updating userEventData altogether
    this.ruleStream$.subscribe({
      error: (err) => this.errorService.showError("rule event stream failed", err),
    });
  }

  getRuleStream() {
    return this.ruleStream$;
  }

  /**
   * Handle one event, and report and drop it if the handling fails, so that the stream stays
   * alive for the events that follow. The handler runs inside defer(), so a throw before it
   * returns an observable is caught too.
   *
   * Only the first failure of each kind is shown to the user, because the stream stays alive
   * and a persistent failure (an expired token, session-db down) would otherwise show a new
   * error for every event. A successful event arms the message again.
   */
  private handleOrDrop<T>(message: string, handle: () => Observable<T>): Observable<T> {
    return defer(handle).pipe(
      // the next event of this kind is reported again. complete() instead of next(), because
      // handlers return EMPTY when there is nothing to do, which is a success too
      tap({ complete: () => this.reportedErrors.delete(message) }),
      catchError((err) => {
        if (this.reportedErrors.has(message)) {
          // the error is already on the screen, showing it again for every event would
          // fill the screen with toasts, because these don't time out
          log.warn(message + " (repeated, not shown to the user)", err);
        } else {
          this.reportedErrors.add(message);
          this.errorService.showError(message, err);
        }
        return EMPTY;
      }),
    );
  }

  /**
   * Apply rule change events in this session and return an observable that sends an event on changes
   */
  applyRuleStreamOfSession(session: Session) {
    return this.getRuleStream().pipe(
      mergeMap((wsEvent) =>
        // sessionEventService can update individual sessions, let's reuse that
        this.sessionEventService.handleRuleEvent(wsEvent, session),
      ),
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
        }),
      );
    }
    if (event.type === EventType.Update) {
      return this.sessionResource.getSession(sessionId).pipe(
        map((session: Session) => {
          log.info("rule updated", session.name);
          userEventData.sessions.set(session.sessionId, session);
          return event;
        }),
      );
    }
    if (event.type === EventType.Delete) {
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
