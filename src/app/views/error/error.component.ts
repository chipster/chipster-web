import { Component, OnInit } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ErrorMessage } from "../../core/errorhandler/errormessage";
import * as _ from "lodash";
import { Router, NavigationStart } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";
import { ToastrService, ActiveToast } from "ngx-toastr";
@Component({
  selector: "ch-error",
  template: "",
})
export class ErrorComponent implements OnInit {

  toastIds: number[] = [];

  readonly BTN_LOGIN = "Log in";
  readonly BTN_RELOAD = "Reload page";

  constructor(
    private errorService: ErrorService,
    private routeService: RouteService,
    private router: Router,
    private toastrService: ToastrService,
  ) {}

  ngOnInit() {
    this.errorService.getErrors().subscribe((error: ErrorMessage) => {
      if (error) {
        const dismissible = error.dismissible;
        const msg = error.msg || "Something went wrong";
        let title = "";
        let buttonText = null;

        if (error.isForbidden()) {
          title = "Authentication failed";
          buttonText = this.BTN_LOGIN;
        } else if (error.isNotFound()) {
          title = "Not found";
          buttonText = this.BTN_RELOAD;
        } else if (error.isConnectionFailed()) {
          title = "Connection failed";
          buttonText = this.BTN_RELOAD;
        } else {
          // reload will fix if something is in a bad state after the error
          buttonText = this.BTN_RELOAD;
        }

        const options = {
          closeButton: dismissible,
          disableTimeOut: true,
          tapToDismiss: dismissible && buttonText == null,
          buttonText: buttonText,
        };

        const toast = this.toastrService.warning(msg, title, options);

        this.toastIds.push(toast.toastId);
        toast.onAction.subscribe(buttonText2 => {
          if (buttonText2 === this.BTN_LOGIN) {
            this.redirect();
          } else if (buttonText2 === this.BTN_RELOAD) {
            this.reload();
          }
        }, err => {
          log.error("error from toastr", err);
        });
      }
    });

    // clear errors when navigating to a new url
    this.router.events
      .filter(event => event instanceof NavigationStart)
      .subscribe(event => {
        this.toastIds.forEach(t => this.toastrService.remove(t));
        this.toastIds = [];
      });
  }

  reload() {
    window.location.reload();
  }

  redirect() {
    this.routeService.redirectToLoginAndBack();
  }
}
