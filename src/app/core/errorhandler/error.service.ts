import { Injectable, NgZone } from "@angular/core";
import log from "loglevel";
import { Observable, Subject } from "rxjs";
import { ErrorButton, ErrorMessage } from "./errormessage";

@Injectable()
export class ErrorService {
  // handle the errors in component, because it can access the router
  private errors$ = new Subject<ErrorMessage>();

  constructor(private ngZone: NgZone) {}

  showError(msg: string, err: Error): void {
    const errorMessage = new ErrorMessage(null, msg, true, [ErrorButton.Reload, ErrorButton.ContactSupport], [], err);
    if (err) {
      errorMessage.links = [ErrorButton.ShowDetails];
    }
    this.showErrorObject(errorMessage);
  }

  showErrorObject(errorMessage: ErrorMessage): void {
    log.error(errorMessage);
    /* Make sure the error messages are shown in angular zone even if it was initated outside of it
    otherwise those would be shown only after next user interaction
    */
    this.ngZone.runTask(() => {
      this.errors$.next(errorMessage);
    });
  }

  getErrors(): Observable<ErrorMessage> {
    return this.errors$;
  }

  showSimpleError(title: string, msg: string): void {
    const errorMessage = new ErrorMessage(title, msg, true, [], [], null);
    this.showErrorObject(errorMessage);
  }
}
