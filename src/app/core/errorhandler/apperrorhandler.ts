import {ErrorHandler, Injectable, Injector} from "@angular/core";
import {ErrorService} from "./error.service";

@Injectable()
export class AppErrorHandler implements ErrorHandler {

  private errorService: ErrorService;

  constructor(
    private injector: Injector) {
    // workaround circular dependency error
    this.errorService = injector.get(ErrorService);
  }

  handleError(error) {

    let msg;

    if (error instanceof Error) {
      msg = error.toString();
    } else if (error.originalError) {
      // e.g. NavigationComponent.getHost() when backend isn't running
      msg = error.originalError;
    } else if (error.rejection && error.rejection.originalError) {
      msg = error.rejection.originalError;
    } else {
      msg = JSON.stringify(error);
    }

    // printing the whole error object may provide useful information, because we can pass only a string
    // to the error page
    console.error('uncaught error', msg, typeof error, error);

    this.errorService.headerError(msg, true);
  }
}
