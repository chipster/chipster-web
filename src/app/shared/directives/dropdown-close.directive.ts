import { Directive, OnDestroy, OnInit, inject } from "@angular/core";
import {
  NgbDropdown,
  NgbDropdownButtonItem,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from "rxjs";
import { DropdownCloseService } from "../services/dropdown-close.service";

/**
 * Attaches to every ngbDropdown (the selector matches ng-bootstrap's own
 * directive) and closes it when DropdownCloseService requests it. See the
 * service for why ng-bootstrap's built-in autoclose isn't always enough.
 *
 * NgbDropdown is injected as optional so that a stray ngbDropdown attribute
 * in a component that doesn't import NgbDropdown stays inert instead of
 * failing injection.
 */
@Directive({
  // matches ng-bootstrap's selector on purpose so the directive attaches to
  // every ngbDropdown without changes to the templates
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: "[ngbDropdown]",
})
export class DropdownCloseDirective implements OnInit, OnDestroy {
  private dropdown = inject(NgbDropdown, { optional: true });
  private dropdownCloseService = inject(DropdownCloseService);

  private subscription: Subscription;

  ngOnInit(): void {
    if (!this.dropdown) {
      return;
    }
    this.subscription = this.dropdownCloseService.closeRequests$.subscribe(() => {
      if (this.dropdown.isOpen()) {
        this.dropdown.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

/**
 * What a component with a dropdown imports, instead of the ng-bootstrap
 * dropdown directives one by one. A component that imported NgbDropdown
 * without DropdownCloseDirective would compile and work, but its dropdown
 * wouldn't close when the service asks, which nothing reports.
 */
export const NGB_DROPDOWN_IMPORTS = [
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbDropdownButtonItem,
  DropdownCloseDirective,
];
