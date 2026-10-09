import { beforeEach, describe, expect, it } from "vitest";
import { ToastService } from "./toast.service";

describe("ToastService", () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it("shows the newest toast first", () => {
    const first = service.info("first");
    const second = service.warning("second", "title");

    expect(service.toasts).toEqual([second, first]);
    expect(second.type).toBe("warning");
    expect(second.title).toBe("title");
  });

  it("makes a plain text message one part of it", () => {
    expect(service.info("message").message).toEqual([{ text: "message" }]);
    expect(service.info("").message).toEqual([]);
    expect(service.info(undefined).message).toEqual([]);
    expect(service.info(null).message).toEqual([]);
  });

  it("keeps the parts of a message", () => {
    const parts = [{ text: "Deleted file " }, { text: "a.txt", bold: true }];

    expect(service.info(parts).message).toEqual(parts);
  });

  it("fills in the options that aren't given", () => {
    const toast = service.info("message", "", { timeout: 0, closeButton: true });

    expect(toast.options).toEqual({
      timeout: 0,
      closeButton: true,
      tapToDismiss: true,
      progressBar: false,
      buttons: [],
      links: [],
    });
  });

  it("keeps the default of an option given as undefined or null", () => {
    const toast = service.info("message", "", { buttons: undefined, links: null, timeout: 0 });

    expect(toast.options.buttons).toEqual([]);
    expect(toast.options.links).toEqual([]);
    expect(toast.options.timeout).toBe(0);
    expect(service.info("message", "", null).options.timeout).toBe(5000);
  });

  it("gives each toast its own default buttons and links", () => {
    const first = service.info("first");
    const second = service.info("second");

    expect(first.options.buttons).not.toBe(second.options.buttons);
    expect(first.options.links).not.toBe(second.options.links);
  });

  it("passes on the clicked button", () => {
    const toast = service.info("message", "", { buttons: [{ text: "Undo" }] });
    const actions: string[] = [];
    toast.onAction.subscribe((text) => actions.push(text));

    toast.action("Undo");

    expect(actions).toEqual(["Undo"]);
  });

  it("closes a toast once", () => {
    const toast = service.info("message");
    let closedCount = 0;
    let actionsCompleted = false;
    toast.afterClosed.subscribe(() => closedCount++);
    toast.onAction.subscribe({
      complete: () => {
        actionsCompleted = true;
      },
    });

    service.close(toast);
    service.close(toast);

    expect(service.toasts).toEqual([]);
    expect(closedCount).toBe(1);
    expect(actionsCompleted).toBe(true);
  });

  it("tells about the closing also when subscribed after it", () => {
    const toast = service.info("message");
    service.close(toast);

    let closed = false;
    toast.afterClosed.subscribe(() => {
      closed = true;
    });

    expect(closed).toBe(true);
  });

  it("keeps the other toasts when one is closed", () => {
    const first = service.info("first");
    const second = service.info("second");

    service.close(first);

    expect(service.toasts).toEqual([second]);
  });

  it("delivers an action to all subscribers even when the first one closes the toast", () => {
    const toast = service.info("message", "", { buttons: [{ text: "Undo" }] });
    const received: string[] = [];
    let completed = false;
    toast.onAction.subscribe(() => service.close(toast));
    toast.onAction.subscribe({
      next: (text) => received.push(text),
      complete: () => {
        completed = true;
      },
    });

    toast.action("Undo");

    expect(received).toEqual(["Undo"]);
    expect(completed).toBe(true);
  });

  it("delivers an action to all subscribers when a subscriber triggers another action", () => {
    const toast = service.info("message", "", { buttons: [{ text: "Undo" }, { text: "Other" }] });
    const received: string[] = [];
    toast.onAction.subscribe((text) => {
      if (text === "Undo") {
        toast.action("Other");
      }
    });
    toast.onAction.subscribe(() => service.close(toast));
    toast.onAction.subscribe((text) => received.push(text));

    toast.action("Undo");

    expect(received).toEqual(["Other", "Undo"]);
  });

  it("ignores clicks after the toast is closed", () => {
    const toast = service.info("message", "", { buttons: [{ text: "Undo" }] });
    const received: string[] = [];
    toast.onAction.subscribe((text) => received.push(text));

    service.close(toast);
    toast.action("Undo");

    expect(received).toEqual([]);
  });
});
