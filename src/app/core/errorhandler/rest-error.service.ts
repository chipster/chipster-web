import {Injectable} from '@angular/core';
import {Response} from "@angular/http";
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

    } else if (RestErrorService.isClientOrConnectionError(error)) {
      this.errorService.headerErrorConnectionFailed(message);

    } else {
      if ((error instanceof HttpErrorResponse || error instanceof Response) && error.status === 429) {
        if (message === "") {
          const retryAfterSeconds = parseInt(error.headers.get("Retry-After"), 10);

          message = "Too many requests, try again ";
          if (retryAfterSeconds != null) {
            message += "after " + this.secondsToHumanReadable(retryAfterSeconds);
          } else {
            message += "later";
          }
        }
        //FIXME remove the reload button
        this.errorService.headerError(message);
      } else {
        this.errorService.headerError(message);
      }
    }

    // log
    console.error(message, error);
  }

  redirectToLoginAndBack() {
    this.routeService.navigateAbsolute('/login', { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
  }

  secondsToHumanReadable(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return days + " days";
    } else if (days === 1) {
      return "a day";
    } else if (hours > 1) {
      return hours + " hours";
    } else if (hours === 1) {
      return "an hour";
    } else if (minutes > 1) {
      return minutes + " minutes";
    } else if (minutes === 1) {
      return "a minute";
    } else if (seconds > 1) {
      return seconds + " seconds";
    } else if (seconds === 1) {
      return "a second";
    } else if (seconds === 0) {
      return "now";
    }
  }
}
