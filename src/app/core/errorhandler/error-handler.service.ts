import {Injectable} from '@angular/core';
import {Response, Request} from "@angular/http";
import {Observable} from "rxjs";
import {Router} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "../../views/error/error.service";

@Injectable()
export class ErrorHandlerService  {

  constructor(private router: Router,
              private errorService: ErrorService) {
  }

  handleError(error: Response | any, message: string = "") {

    // show alert
    if (ErrorHandlerService.isForbidden(error)) {
      this.errorService.headerErrorForbidden(message);
    } else {
      this.errorService.headerErrorConnectionFailed(message);
    }

    // log
    console.error(message, error);
  }

  redirectToLoginAndBack() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
  }

  static isForbidden(error: HttpErrorResponse | any) {
    return (error instanceof HttpErrorResponse || error instanceof Response) && error.status === 403;
  }

  static isClientOrConnectionError(error: HttpErrorResponse){
    //return error instanceof Error;
    return error.status === 0;
  }

  static isServerSideError(error: HttpErrorResponse ) {
    return !ErrorHandlerService.isClientOrConnectionError(error);
  }

}
