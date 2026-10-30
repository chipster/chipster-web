import { ErrorHandler, Injectable, inject } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "./error.service";

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private errorService = inject(ErrorService);
  // the NG0100 messages shown as toasts
  private staleViewsShown = new Set<string>();

  handleError(error) {
    let msg;

    if (error instanceof Error) {
      msg = error.toString();

      /*
      The dev check of app.config.ts reports a view that changed without notifying Angular
      (NG0100) again on every run, once a second, with the same message. Show it as a toast
      once and log the rest, so that the toasts don't cover the page.
      */
      if (error.message.startsWith("NG0100")) {
        if (this.staleViewsShown.has(msg)) {
          log.error(error);
          return;
        }
        this.staleViewsShown.add(msg);
      }
    } else if (error.originalError) {
      // e.g. NavigationComponent.getHost() when backend isn't running
      msg = error.originalError;
    } else if (error.rejection && error.rejection.originalError) {
      msg = error.rejection.originalError;
    } else {
      msg = JSON.stringify(error);
    }

    this.errorService.showError(msg, error);
  }
}
