import { Component, OnInit } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ErrorMessage } from "../../core/errorhandler/errormessage";
import * as _ from "lodash";
import { Router, NavigationStart } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";
@Component({
  selector: "ch-error",
  templateUrl: "./error.component.html"
})
export class ErrorComponent implements OnInit {
  errors: ErrorMessage[] = [];

  constructor(
    private errorService: ErrorService,
    private routeService: RouteService,
    private router: Router
  ) {}

  ngOnInit() {
    this.errorService.getErrors().subscribe((error: ErrorMessage) => {
      log.info("error component got new error", error);
      if (error) {
        this.errors = this.errors.concat(error);
      }
    });

    // clear errors when navigating to a new url
    this.router.events
      .filter(event => event instanceof NavigationStart)
      .subscribe(event => {
        this.errors = [];
      });
  }

  closeAlert(error: ErrorMessage) {
    this.errors = _.without(this.errors, error);
  }

  reload() {
    window.location.reload();
  }

  redirect() {
    this.routeService.redirectToLoginAndBack();
  }
}
