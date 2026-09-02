import { Directive, OnDestroy, OnInit, Optional } from "@angular/core";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from "rxjs";
import { DropdownCloseService } from "../services/dropdown-close.service";

/**
 * Attaches to every ngbDropdown (the selector matches ng-bootstrap's own
 * directive) and closes it when DropdownCloseService requests it. See the
 * service for why ng-bootstrap's built-in autoclose isn't always enough.
 *
 * NgbDropdown is injected as optional so that a stray ngbDropdown attribute
 * in a module without NgbModule stays inert instead of failing injection.
 */
@Directive({
  // matches ng-bootstrap's selector on purpose so the directive attaches to
  // every ngbDropdown without changes to the templates
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: "[ngbDropdown]",
})
export class DropdownCloseDirective implements OnInit, OnDestroy {
  private subscription: Subscription;

  constructor(
    @Optional() private dropdown: NgbDropdown,
    private dropdownCloseService: DropdownCloseService,
  ) {}

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
