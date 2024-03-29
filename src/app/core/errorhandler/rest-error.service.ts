import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import log from "loglevel";
import { ErrorService } from "./error.service";
import { ErrorButton, ErrorMessage } from "./errormessage";

@Injectable()
export class RestErrorService {
  static isForbidden(error: HttpErrorResponse | any) {
    return RestErrorService.isHttpError(error, 403);
  }

  static isNotFound(error: HttpErrorResponse | any) {
    return RestErrorService.isHttpError(error, 404);
  }

  static isTooManyRequests(error: HttpErrorResponse | any) {
    return RestErrorService.isHttpError(error, 429);
  }

  static isHttpError(error: HttpErrorResponse | any, status: number) {
    return (error instanceof HttpErrorResponse || error instanceof Response) && error.status === status;
  }

  static isClientOrConnectionError(error: HttpErrorResponse) {
    return error.status === 0;
  }

  static isServerSideError(error: HttpErrorResponse) {
    return !RestErrorService.isClientOrConnectionError(error);
  }

  constructor(private errorService: ErrorService) {}

  /**
   * Show an error with sensible actions based on the HTTP response
   *
   * @param message
   * @param resp
   */
  showError(message: string, resp: Response | any) {
    /* Catch the current stacktrace

    Creating and Error object saves to current stacktrace. If this handleError()
    method was called from the subscribe()'s error function, the stack nicely points
    to the code that made the request.
    */
    const error = new Error(resp);

    const errorMessage = new ErrorMessage(
      null,
      message,
      true,
      [ErrorButton.Reload, ErrorButton.ContactSupport],
      [],
      error
    );

    if (error) {
      errorMessage.links = [ErrorButton.ShowDetails];
    }

    // show alert
    if (RestErrorService.isForbidden(resp)) {
      errorMessage.title = "Authentication failed";
      errorMessage.buttons = [ErrorButton.LogIn, ErrorButton.ContactSupport];
    } else if (RestErrorService.isNotFound(resp)) {
      errorMessage.title = "Not found";
    } else if (RestErrorService.isClientOrConnectionError(resp)) {
      errorMessage.title = "Connection failed";
    } else if (RestErrorService.isTooManyRequests(resp)) {
      errorMessage.title = message;
      errorMessage.msg = this.getTooManyRequestsMessage(resp);
      errorMessage.buttons = [ErrorButton.ContactSupport];
    }

    this.errorService.showErrorObject(errorMessage);

    // log
    log.info("rest error handled", message, resp);
  }

  getTooManyRequestsMessage(resp) {
    const retryAfterSeconds = parseInt(resp.headers.get("Retry-After"), 10);

    let message = "Too many requests, try again ";
    if (retryAfterSeconds != null) {
      message += "after " + this.secondsToHumanReadable(retryAfterSeconds);
    } else {
      message += "later";
    }
    return message;
  }

  secondsToHumanReadable(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return days + " days";
    }
    if (days === 1) {
      return "a day";
    }
    if (hours > 1) {
      return hours + " hours";
    }
    if (hours === 1) {
      return "an hour";
    }
    if (minutes > 1) {
      return minutes + " minutes";
    }
    if (minutes === 1) {
      return "a minute";
    }
    if (seconds > 1) {
      return seconds + " seconds";
    }
    if (seconds === 1) {
      return "a second";
    }
    if (seconds === 0) {
      return "now";
    }
    return seconds?.toString();
  }

  /**
   * Version of showError to be used for admin api requests. In case of connection failed, adds admin backend note to the error message.
   *
   * @param message
   * @param resp
   */
  showErrorAdmin(message: string, resp: Response | any) {
    if (RestErrorService.isClientOrConnectionError(resp)) {
      this.showError(message + " Connecting to admin backend failed.", resp);
    } else {
      this.showError(message, resp);
    }
  }
}
