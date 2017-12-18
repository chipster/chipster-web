import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Subject} from "rxjs";
import {ErrorMessage} from "./errormessage";

@Injectable()
export class ErrorService {

  private errors$ = new Subject();

  headerError(msg: string, dismissible: boolean) {
    this.errors$.next(new ErrorMessage(msg, dismissible));
  }

  headerErrorForbidden(msg?: string) {
    this.errors$.next(new ErrorMessage("Authentication failed, please log in.", true));
  }

  headerErrorConnectionFailed(msg?: string) {
    this.errors$.next(new ErrorMessage("Connection failed, please reload the page", true));
  }

  getErrors() {
    return this.errors$;
  }
}
