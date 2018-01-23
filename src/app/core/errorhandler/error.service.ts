import {Injectable} from "@angular/core";
import {Subject} from "rxjs";
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

  getErrors() {
    return this.errors$;
  }
}
