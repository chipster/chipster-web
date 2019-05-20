import { Component, OnInit } from "@angular/core";
import { ErrorService } from "../../core/errorhandler/error.service";
import { ErrorMessage, ErrorButton } from "../../core/errorhandler/errormessage";
import * as _ from "lodash";
import { Router, NavigationStart } from "@angular/router";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";
import { ToastrService } from "ngx-toastr";
import { ContactSupportService } from "../contact/contact-support.service";
import * as StackTrace from 'stacktrace-js';
import { of, from, Observable, empty, EMPTY } from "rxjs";
import { tap, filter, mergeMap, catchError, map } from "rxjs/operators";
import { DialogModalService } from "../sessions/session/dialogmodal/dialogmodal.service";
@Component({
  selector: "ch-error",
  template: "",
})
export class ErrorComponent implements OnInit {

  toastIds: number[] = [];

  constructor(
    private errorService: ErrorService,
    private routeService: RouteService,
    private router: Router,
    private toastrService: ToastrService,
    private contactSupportService: ContactSupportService,
    private dialogModalService: DialogModalService,
  ) { }

  ngOnInit() {

    // clear errors when navigating to a new url
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart))
      .subscribe(event => {
        this.toastIds.forEach(t => this.toastrService.remove(t));
        this.toastIds = [];
      }, err => this.errorService.showError("getting router events failed", err)
      );

    this.errorService.getErrors().pipe(
      filter((error: ErrorMessage) => error != null),
      mergeMap((error: ErrorMessage) => {

        const dismissible = error.dismissible;
        const msg = error.msg || "Something went wrong";
        const title = error.title || "";

        const options = {
          closeButton: dismissible,
          disableTimeOut: true,
          tapToDismiss: dismissible && error.buttons.length === 0,
          buttons: [],
          links: [],
        };

        options.buttons = error.buttons.map(button => {
          return {
            text: button,
          };
        });

        options.links = error.links.map(link => {
          return {
            text: link,
          };
        });

        const toast = this.toastrService.warning(msg, title, options);

        this.toastIds.push(toast.toastId);
        return toast.onAction.pipe(
          mergeMap(buttonText => {

            if (buttonText === ErrorButton.LogIn) {
              this.redirect();

            } else if (buttonText === ErrorButton.Reload) {
              this.reload();

            } else if (buttonText === ErrorButton.ContactSupport) {
              // don't use remove(), beause that would apparently cancel the onAction observable
              this.toastrService.clear(toast.toastId);
              return this.contactSupport(error);

            } else if (buttonText === ErrorButton.ShowDetails) {
              return this.showDetails(title + " details", error);

            } else {
              log.error("unknown action", buttonText);
            }
            return EMPTY;
          }),
        );
      }),
    ).subscribe(null, err => {
      // just log when the error dialog fails
      log.error("error from toastr", err);
    });
  }

  reload() {
    window.location.reload();
  }

  redirect() {
    this.routeService.redirectToLoginAndBack();
  }

  contactSupport(errorMessage: ErrorMessage) {
    const collectInfo$ = this.errorMessageToString(errorMessage).pipe(
      tap(logString => {
        this.contactSupportService.openContactSupportModal(logString);
      }),
    );

    return this.dialogModalService.openSpinnerModal("Collecting information", collectInfo$);
  }

  showDetails(title: string, errorMessage: ErrorMessage) {
    const collectInfo$ = this.errorMessageToString(errorMessage).pipe(
      tap(logString => {
        this.dialogModalService.openPreModal(title, logString);
      }),
    );

    return this.dialogModalService.openSpinnerModal("Collecting information", collectInfo$);
  }

  errorMessageToString(errorMessage: ErrorMessage): Observable<string> {

    let info = "Client error\n";
    info += "title: " + errorMessage.title + "\n";
    info += "message: " + errorMessage.msg + "\n";
    if (errorMessage.error) {
      const error = errorMessage.error;
      info += "causd by";
      if (error.constructor) {
        // e.g. "Error"
        info += " " + error.constructor.name;
      }
      info += ": ";

      if (error.message) {
        // the message given when creating the error object
        info += error.message + "\n";
      }

      // print the whole object if it's something else
      const errorAsJson = JSON.stringify(errorMessage.error, null, 2);
      if (errorAsJson !== "{}") {
        info += "\n" + errorAsJson + "\n";
      }

      // try to get the source mapped stacktrace
      return from(StackTrace.fromError(errorMessage.error)).pipe(
        map((sf: any[]) => this.stackframesToString(sf)),
        map(stack => info + "stack: \n" + stack + "\n"),
        catchError(stackErr => of(info + "stack: (failed to get the stack: " + stackErr + ")\n")),
      );
    } else {
      return of(info);
    }
  }

  stackframesToString(stackframes: any[], maxCount = 20) {
    return stackframes
      .splice(0, maxCount)
      .map(sf => sf.toString())
      .join('\n');
  }
}
