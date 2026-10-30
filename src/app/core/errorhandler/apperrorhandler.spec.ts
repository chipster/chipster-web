import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("shows every error", () => {
    handler.handleError(new Error("first"));
    handler.handleError(new Error("first"));

    expect(shown).toEqual(["Error: first", "Error: first"]);
  });

  it("shows a stale view once and logs the repeats", () => {
    const stale = () => new Error("NG0100: Expression has changed after it was checked. Previous value: 'a'");
    handler.handleError(stale());
    handler.handleError(stale());
    handler.handleError(new Error("NG0100: Expression has changed after it was checked. Previous value: 'b'"));

    expect(shown).toEqual([
      "Error: NG0100: Expression has changed after it was checked. Previous value: 'a'",
      "Error: NG0100: Expression has changed after it was checked. Previous value: 'b'",
    ]);
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
