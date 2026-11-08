import { computed } from "@angular/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenService } from "./token.service";

// an unsigned JWS: jwtDecode() only decodes the payload
function token(validSeconds: number): string {
  const base64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = {
    sub: "jaas/user",
    name: "User",
    roles: ["client"],
    exp: String(Math.floor(Date.now() / 1000) + validSeconds),
  };
  return base64url({ alg: "none" }) + "." + base64url(payload) + ".";
}

describe("TokenService", () => {
  let service: TokenService;

  beforeEach(() => {
    vi.useFakeTimers();
    // a whole second, so that the tokens' exp (in seconds) is exactly validSeconds away
    vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
    localStorage.clear();
    service = new TokenService();
  });

  afterEach(() => {
    service.setAuthToken(null);
    vi.useRealTimers();
  });

  it("notifies a view of the login state when the token is set, when it expires and when it's cleared", () => {
    // a computed() is notified like an OnPush template is
    const loggedIn = computed(() => service.isLoggedIn());
    expect(loggedIn()).toBeFalsy();

    service.setAuthToken(token(60));
    expect(loggedIn()).toBeTruthy();

    vi.advanceTimersByTime(59_000);
    expect(loggedIn()).toBeTruthy();
    vi.advanceTimersByTime(2_000);
    expect(loggedIn()).toBeFalsy();

    service.setAuthToken(token(60));
    expect(loggedIn()).toBeTruthy();
    service.clear();
    expect(loggedIn()).toBeFalsy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("notifies of the expiry of a token that is valid for longer than setTimeout's maximum delay", () => {
    const loggedIn = computed(() => service.isLoggedIn());
    const days = 24 * 60 * 60;
    service.setAuthToken(token(30 * days));

    vi.advanceTimersByTime(2 ** 31 - 1);
    expect(loggedIn()).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(30 * days * 1000);
    expect(loggedIn()).toBeFalsy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the current token and its expiry timer when a malformed token is set", () => {
    const loggedIn = computed(() => service.isLoggedIn());
    service.setAuthToken(token(60));

    expect(() => service.setAuthToken("not a token")).toThrow();
    expect(loggedIn()).toBeTruthy();
    expect(service.getUsername()).toBe("jaas/user");

    vi.advanceTimersByTime(61_000);
    expect(loggedIn()).toBeFalsy();
  });

  it("schedules one expiry timer at a time, for the latest token", () => {
    const loggedIn = computed(() => service.isLoggedIn());
    service.setAuthToken(token(60));
    service.setAuthToken(token(120));
    expect(loggedIn()).toBeTruthy();

    vi.advanceTimersByTime(61_000);
    expect(loggedIn()).toBeTruthy();
    vi.advanceTimersByTime(60_000);
    expect(loggedIn()).toBeFalsy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
