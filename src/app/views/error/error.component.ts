import {Component} from "@angular/core";
import {ErrorService} from "./error.service";
import {ErrorMessage, ErrorType} from "./errormessage";
import * as _ from 'lodash';
import {ErrorHandlerService} from "../../core/errorhandler/error-handler.service";
import {NavigationEnd, Router} from "@angular/router";

@Component({
  selector: 'ch-error',
  templateUrl: './error.html'
})
export class ErrorComponent {

  private errors: ErrorMessage[] = [];

  constructor(
    private errorService: ErrorService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router) {}

  ngOnInit() {
    this.errorService.getErrors().subscribe((error: ErrorMessage) => {
      if (error) {
        this.errors.push(error);
      }
    });

    // clear errors when navigating to a new url
    this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .subscribe((event) => {
        this.errors =  [];
      });
  }

  closeAlert(error: ErrorMessage) {
    this.errors = _.without(this.errors, error);
  }

  isForbidden(errorType: ErrorType) : boolean {
    return ErrorType.FORBIDDEN === errorType;
  }

  isConnectionFailed(errorType: ErrorType) : boolean {
    return ErrorType.CONNECTION_FAILED === errorType;
  }

  isDefault(errorType: ErrorType) : boolean {
    return ErrorType.DEFAULT === errorType;
  }

  reload() {
    window.location.reload();
  }

}
