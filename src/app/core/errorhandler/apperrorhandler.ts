import { ErrorHandler, Injectable, inject } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "./error.service";

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private errorService = inject(ErrorService);

  handleError(error) {
    let msg;

    if (error instanceof Error) {
      /*
      The dev check of app.config.ts reports a view that changed without notifying Angular
      (NG0100) again on every run, once a second. Only in the console, so that the toasts
      don't cover the page.
      */
      if (error.message.startsWith("NG0100")) {
        log.error(error);
        return;
      }
      /*
      A browser error event without an error object, which the global error listeners of
      app.config.ts wrap in an Error. The browser gives no details of these: e.g. "ResizeObserver
      loop completed with undelivered notifications", which is harmless, or "Script error." of a
      script from another origin, like a browser extension. Nothing the user could act on.
      */
      if (error.cause instanceof ErrorEvent) {
        log.error(error);
        return;
      }
      msg = error.toString();
    } else if (error?.originalError) {
      // e.g. NavigationComponent.getHost() when backend isn't running
      msg = error.originalError;
    } else if (error != null) {
      msg = JSON.stringify(error);
    }
    // a promise rejected without a reason leaves msg empty, and the toast says "Something went wrong"

    this.errorService.showError(msg, error);
  }
}
