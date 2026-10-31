import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import log from "loglevel";
import { AppErrorHandler } from "./apperrorhandler";
import { ErrorService } from "./error.service";

describe("AppErrorHandler", () => {
  let handler: AppErrorHandler;
  let shown: string[];

  beforeEach(() => {
    shown = [];
    const errorServiceStub = {
      showError: (msg: string) => {
        shown.push(msg);
      },
    } as unknown as ErrorService;
    TestBed.configureTestingModule({
      providers: [AppErrorHandler, { provide: ErrorService, useValue: errorServiceStub }],
    });
    handler = TestBed.inject(AppErrorHandler);
    vi.spyOn(log, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows every error", () => {
    handler.handleError(new Error("first"));
    handler.handleError(new Error("first"));

    expect(shown).toEqual(["Error: first", "Error: first"]);
  });

  it("logs a stale view instead of showing it", () => {
    const stale = new Error("NG0100: Expression has changed after it was checked. Previous value: 'a'");
    handler.handleError(stale);

    expect(shown).toEqual([]);
    expect(log.error).toHaveBeenCalledWith(stale);
  });
});
