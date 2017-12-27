import {Component} from "@angular/core";
import {ErrorService} from "../../core/errorhandler/error.service";
import {ErrorMessage} from "../../core/errorhandler/errormessage";
import * as _ from 'lodash';
import {NavigationEnd, Router} from "@angular/router";
import {RouteService} from "../../shared/services/route.service";

@Component({
  selector: 'ch-error',
  templateUrl: './error.html'
})
export class ErrorComponent {

  private errors: ErrorMessage[] = [];

  constructor(
    private errorService: ErrorService,
    private routeService: RouteService,
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

  reload() {
    window.location.reload();
  }

  redirect() {
    this.routeService.redirectToLoginAndBack()
  }
}
