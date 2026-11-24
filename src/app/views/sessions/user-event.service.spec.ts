import { TestBed } from "@angular/core/testing";
import { EventType, Resource, Rule, Session, WsEvent } from "chipster-js-common";
import { firstValueFrom } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrorService } from "../../core/errorhandler/error.service";
import { SessionResource } from "../../shared/resources/session.resource";
import { WebSocketService } from "../../shared/services/websocket.service";
import { SessionDataService } from "./session/session-data.service";
import { SessionEventService } from "./session/session-event.service";
import { UserEventData } from "./user-event-data";
import { UserEventService } from "./user-event.service";

/*
 * The rule events of the sessions list. A delete event removes the rule, and
 * the whole session when none of the remaining rules is the user's.
 */
describe("UserEventService", () => {
  const userId = "jaas/chipster";
  let service: UserEventService;
  let data: UserEventData;

  beforeEach(() => {
    // only the rules of the user and of everyone apply to the user, like in SessionDataService
    const sessionDataServiceStub = {
      getApplicableRules: (rules: Rule[]) => rules.filter((r) => r.username === userId || r.username === "everyone"),
    } as unknown as SessionDataService;
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionResource, useValue: {} },
        { provide: WebSocketService, useValue: {} },
        { provide: SessionDataService, useValue: sessionDataServiceStub },
        { provide: SessionEventService, useValue: {} },
        { provide: ErrorService, useValue: {} },
      ],
    });
    service = TestBed.inject(UserEventService);
    data = { sessions: new Map<string, Session>() };
  });

  function session(sessionId: string, rules: Partial<Rule>[]): Session {
    return { sessionId, rules } as Session;
  }

  function ruleDeleted(sessionId: string, ruleId: string): WsEvent {
    return { sessionId, resourceType: Resource.Rule, resourceId: ruleId, type: EventType.Delete } as WsEvent;
  }

  it("should remove only the deleted rule when the user still has one", async () => {
    data.sessions.set(
      "s1",
      session("s1", [
        { ruleId: "r1", username: userId },
        { ruleId: "r2", username: "jaas/admin" },
      ]),
    );

    await firstValueFrom(service.handleRuleEvent(ruleDeleted("s1", "r2"), "s1", data));

    expect(data.sessions.get("s1").rules.map((r) => r.ruleId)).toEqual(["r1"]);
  });

  it("should remove the session when the user's rule is deleted", async () => {
    data.sessions.set(
      "s1",
      session("s1", [
        { ruleId: "r1", username: userId },
        { ruleId: "r2", username: "jaas/admin" },
      ]),
    );

    await firstValueFrom(service.handleRuleEvent(ruleDeleted("s1", "r1"), "s1", data));

    expect(data.sessions.has("s1")).toBe(false);
  });

  it("should ignore a deleted rule of a session that the list doesn't have", async () => {
    data.sessions.set("s1", session("s1", [{ ruleId: "r1", username: userId }]));
    const event = ruleDeleted("s2", "r2");

    expect(await firstValueFrom(service.handleRuleEvent(event, "s2", data))).toBe(event);

    expect([...data.sessions.keys()]).toEqual(["s1"]);
  });
});
