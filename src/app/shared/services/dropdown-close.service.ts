import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

/**
 * Lets a component ask all open ngb-dropdowns to close.
 *
 * ng-bootstrap's own autoclose relies on document-level mousedown/mouseup
 * listeners, which never fire for pointer events that some other handler
 * (e.g. d3-drag in the workflow graph) stops with stopImmediatePropagation.
 * Components that swallow pointer events this way can call
 * closeOpenDropdowns() instead; DropdownCloseDirective forwards the request
 * to every ngbDropdown instance.
 */
@Injectable({ providedIn: "root" })
export class DropdownCloseService {
  private closeRequests = new Subject<void>();

  get closeRequests$(): Observable<void> {
    return this.closeRequests.asObservable();
  }

  closeOpenDropdowns(): void {
    this.closeRequests.next();
  }
}
