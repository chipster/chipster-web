import {Injectable} from '@angular/core';
import {Response, Request} from "@angular/http";
import {Observable} from "rxjs";
import {Router} from "@angular/router";

@Injectable()
export class ErrorHandlerService  {

  constructor(private router: Router) { }

  /*
   * @description: handler for http-request catch-clauses
   */
  handleError(error: Response | any, request: Request) {
    let errorMessage: string;

    if (error instanceof Response) {
      if (error.status === 0) {
        // dns name resolution failed,
        // server did not answer or
        // request aborted because of a CORS issue
        errorMessage = 'Connection error ' + request.url;
      } else {
        // http error
        const err = error.text() || '';
        errorMessage = `${error.status} - ${error.statusText || ''} (${err})`;
      }
    } else {
      // unreachable code?
      errorMessage = error.message ? error.message : error.toString();
    }

    return Observable.throw(errorMessage);
  }

  redirectToLoginAndBack() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
  }

  static isForbidden(error: Response | any) {
    return error instanceof Response && error.status === 403;
  }
}
