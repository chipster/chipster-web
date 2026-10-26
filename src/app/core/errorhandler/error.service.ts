import { Injectable } from "@angular/core";
import log from "loglevel";
import { Observable, Subject } from "rxjs";
import { ErrorButton, ErrorMessage } from "./errormessage";

@Injectable({ providedIn: "root" })
export class ErrorService {
  // handle the errors in component, because it can access the router
  private errors$ = new Subject<ErrorMessage>();

  showError(msg: string, err: Error): void {
    const errorMessage = new ErrorMessage(null, msg, true, [ErrorButton.Reload, ErrorButton.ContactSupport], [], err);
    if (err) {
      errorMessage.links = [ErrorButton.ShowDetails];
    }
    this.showErrorObject(errorMessage);
  }

  showErrorObject(errorMessage: ErrorMessage): void {
    log.error(errorMessage);
    // ToastService keeps the toasts in a signal, which updates the view also when the error comes from outside Angular
    this.errors$.next(errorMessage);
  }

  getErrors(): Observable<ErrorMessage> {
    return this.errors$;
  }

  showSimpleError(title: string, msg: string): void {
    const errorMessage = new ErrorMessage(title, msg, true, [], [], null);
    this.showErrorObject(errorMessage);
  }
}
