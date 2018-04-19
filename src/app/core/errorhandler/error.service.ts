import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {ErrorMessage, ErrorType} from "./errormessage";

@Injectable()
export class ErrorService {

  private errors$ = new Subject();

  headerError(msg?: string, dismissible: boolean = true) {
    this.errors$.next(new ErrorMessage(msg, dismissible, ErrorType.DEFAULT));
  }

  headerErrorForbidden(msg?: string, dismissable: boolean = true) {
    this.errors$.next(new ErrorMessage(msg, dismissable, ErrorType.FORBIDDEN));
  }

  headerErrorConnectionFailed(msg?: string, dismissable: boolean = true) {
    this.errors$.next(new ErrorMessage(msg, dismissable, ErrorType.CONNECTION_FAILED));
  }

  headerErrorNotFound(msg?: string, dismissable: boolean = true) {
    this.errors$.next(new ErrorMessage(msg, dismissable, ErrorType.NOT_FOUND));
  }

  getErrors() {
    return this.errors$;
  }
}
