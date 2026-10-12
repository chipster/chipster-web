import { Injectable } from "@angular/core";
import { isNil, omitBy } from "lodash-es";
import { AsyncSubject, Observable, Subject } from "rxjs";

export type ToastType = "info" | "warning";

// a piece of the message, shown as text like the rest of it
export interface ToastTextPart {
  text: string;
  bold?: boolean;
}

// plain text, or parts of it in bold
export type ToastMessage = string | ToastTextPart[];

export interface ToastButton {
  text: string;
  icon?: string;
  // a Bootstrap button class like "btn-info", btn-secondary by default
  class?: string;
}

export interface ToastOptions {
  // milliseconds until the toast closes itself, 0 keeps it open until the user closes it
  timeout?: number;
  closeButton?: boolean;
  // close the toast when it's clicked anywhere else than on its buttons and links
  tapToDismiss?: boolean;
  // show how much time is left before the toast closes itself
  progressBar?: boolean;
  // buttons below the message, aligned right
  buttons?: ToastButton[];
  // link buttons right after the message
  links?: ToastButton[];
}

// new arrays for each toast, so that changing the buttons of one doesn't change the others
function defaultOptions(): Required<ToastOptions> {
  return {
    timeout: 5000,
    closeButton: false,
    tapToDismiss: true,
    progressBar: false,
    buttons: [],
    links: [],
  };
}

/**
 * A toast that is shown with ToastService.
 *
 * The title and the message are always shown as text, never parsed as HTML.
 */
export class Toast {
  private readonly actionSubject = new Subject<string>();
  private readonly closedSubject = new AsyncSubject<void>();

  // the text of the button or link that was clicked, completes when the toast is closed
  readonly onAction: Observable<string> = this.actionSubject.asObservable();
  // emits once when the toast is closed, however it was closed, also to late subscribers
  readonly afterClosed: Observable<void> = this.closedSubject.asObservable();

  readonly message: ToastTextPart[];
  readonly options: Required<ToastOptions>;

  private isClosed = false;
  // action() calls in progress, in case a subscriber of onAction triggers another one
  private actionDepth = 0;

  constructor(
    readonly type: ToastType,
    message: ToastMessage,
    readonly title: string,
    options: ToastOptions,
  ) {
    if (message == null) {
      // a caller may pass a name or an error message that isn't set
      this.message = [];
    } else if (typeof message === "string") {
      this.message = message ? [{ text: message }] : [];
    } else {
      this.message = message;
    }
    // an option given as undefined or null keeps its default
    this.options = { ...defaultOptions(), ...omitBy(options, isNil) };
  }

  // called by ToastsComponent when a button or a link is clicked
  action(text: string): void {
    this.actionDepth++;
    try {
      this.actionSubject.next(text);
    } finally {
      this.actionDepth--;
    }
    if (this.isClosed && this.actionDepth === 0) {
      this.actionSubject.complete();
    }
  }

  // called by ToastService when the toast is removed
  closed(): void {
    this.isClosed = true;
    /*
     * A subscriber of onAction may close the toast. Completing the subject in
     * the middle of next() would stop the subscribers that haven't got the
     * action yet, so action() completes it after all of them have it.
     */
    if (this.actionDepth === 0) {
      this.actionSubject.complete();
    }
    this.closedSubject.next();
    this.closedSubject.complete();
  }
}

/**
 * Shows toasts in the top right corner, newest first. ToastsComponent shows them.
 */
@Injectable({ providedIn: "root" })
export class ToastService {
  toasts: Toast[] = [];

  info(message: ToastMessage, title = "", options: ToastOptions = {}): Toast {
    return this.show(new Toast("info", message, title, options));
  }

  warning(message: ToastMessage, title = "", options: ToastOptions = {}): Toast {
    return this.show(new Toast("warning", message, title, options));
  }

  /**
   * Remove the toast right away. Does nothing if the toast is already closed.
   */
  close(toast: Toast): void {
    if (!this.toasts.includes(toast)) {
      return;
    }
    this.toasts = this.toasts.filter((t) => t !== toast);
    toast.closed();
  }

  private show(toast: Toast): Toast {
    this.toasts = [toast, ...this.toasts];
    return toast;
  }
}
