import {ErrorHandler, Injectable, Injector} from "@angular/core";
import {Router} from "@angular/router";
import {ErrorService} from "./error.service";

@Injectable()
export class AppErrorHandler implements ErrorHandler {

  private router: Router;
  private errorService: ErrorService;

  constructor(
    private injector: Injector) {
    // workaround circular dependency error
    this.router = injector.get(Router);
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
    console.log('uncaught error', msg, typeof error, error);

    this.errorService.headerError(msg, true);
  }
}
