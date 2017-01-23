import {Injectable, ErrorHandler} from '@angular/core';
import {Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()
export class ErrorHandlerService implements ErrorHandler {

  constructor() { }

  /*
   * @description: handler for http-request catch-clauses
   */
  handleError(error: Response | any) {
    let errorMessage: string;

    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errorMessage = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errorMessage = error.message ? error.message : error.toString();
    }

    return Observable.throw(errorMessage);
  }


}
