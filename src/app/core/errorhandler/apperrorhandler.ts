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
      msg = error.toString();
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
