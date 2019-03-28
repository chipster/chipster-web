import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ErrorMessage, ErrorButton } from "./errormessage";
import log from "loglevel";

@Injectable()
export class ErrorService {
  // handle the errors in component, because it can access the router
  private errors$ = new Subject();

  showError(msg: string, err: Error) {
    const errorMessage = new ErrorMessage(
      null,
      msg,
      true,
      [ErrorButton.Reload, ErrorButton.ContactSupport],
      [],
      err
    );
    if (err) {
      errorMessage.links = [ErrorButton.ShowDetails];
    }
    this.showErrorObject(errorMessage);
  }

  showErrorObject(errorMessage: ErrorMessage) {
    log.error(errorMessage);
    this.errors$.next(errorMessage);
  }

  getErrors() {
    return this.errors$;
  }
}
