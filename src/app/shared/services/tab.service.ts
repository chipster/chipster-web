import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { SessionService } from "../../views/sessions/session/session.service";

@Injectable()
export class TabService {
  constructor(
    private errorService: ErrorService,
    private restErrorService: RestErrorService,
    private sessionService: SessionService,
  ) {}

  openNewTab(sessionId: string, dataset: Dataset) {
    this.newTab(
      /* Set type=true to ask server to add a content-type header, because Chrome doesn't
        open pdf files in new tab without it. */
      this.sessionService.getDatasetUrl(sessionId, dataset).pipe(map((url) => url + "&type=true")),
      "Browser's pop-up blocker prevented opening a new tab",
    );
  }

  newTab(url$: Observable<string>, popupErrorText: string) {
    // window has to be opened synchronously, otherwise the pop-up blocker will prevent it
    const win: any = window.open("", "_blank");
    if (win) {
      url$.subscribe(
        (url) => {
          // but we can set it's location later asynchronously
          win.location.href = url;
        },
        (err) => this.restErrorService.showError("opening a new tab failed", err),
      );
    } else {
      // popup blocker prevented this
      this.errorService.showError(popupErrorText, null);
    }
  }
}
