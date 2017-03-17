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

  getErrors() {
    return this.errors$;
  }
}
