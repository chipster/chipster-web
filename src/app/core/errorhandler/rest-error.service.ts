import {Injectable} from '@angular/core';
import {Response, Request} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {Router} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";
import { RouteService } from '../../shared/services/route.service';

@Injectable()
export class RestErrorService  {

  static isForbidden(error: HttpErrorResponse | any) {
    return (error instanceof HttpErrorResponse || error instanceof Response) && error.status === 403;
  }

  static isNotFound(error: HttpErrorResponse | any) {
    return (error instanceof HttpErrorResponse || error instanceof Response) && error.status === 404;
  }

  static isClientOrConnectionError(error: HttpErrorResponse) {
    return error.status === 0;
  }

  static isServerSideError(error: HttpErrorResponse ) {
    return !RestErrorService.isClientOrConnectionError(error);
  }

  constructor(
    private router: Router,
    private errorService: ErrorService,
    private routeService: RouteService) {
  }

  handleError(error: Response | any, message: string = "") {

    // show alert
    if (RestErrorService.isForbidden(error)) {
      this.errorService.headerErrorForbidden(message);

    } else if (RestErrorService.isNotFound(error)) {
      this.errorService.headerErrorNotFound(message);

    } else {
      this.errorService.headerErrorConnectionFailed(message);
    }

    // log
    console.error(message, error);
  }

  redirectToLoginAndBack() {
    this.routeService.navigateAbsolute(['/login'], { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
  }
}
