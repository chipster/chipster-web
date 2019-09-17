import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { ErrorService } from "./error.service";

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(private errorService: ErrorService) {}

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

    this.errorService.showError(msg, error);
  }
}
