import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NgbNavOutlet } from "@ng-bootstrap/ng-bootstrap";

/**
 * Checks ng-bootstrap's NgbNavOutlet again when the items of its nav change.
 *
 * NgbNavOutlet is OnPush: ng-bootstrap 21 is compiled with Angular 22, where a component without
 * a changeDetection is OnPush. Its template lists the items of the nav, but it's checked only when
 * its inputs or the active item change. When tabs come and go with an @if while the active one
 * stays, the outlet keeps the old items. Nothing shows, because only the active pane is in the
 * DOM, but the dev check of app.config.ts finds the new items and reports NG0100.
 *
 * The changes of the items are emitted when the view that declares the nav is checked, before its
 * child components, so the outlet is checked in the same pass.
 *
 * Import it in the components that have a nav whose items change.
 */
@Directive({
  // matches ng-bootstrap's selector on purpose, so that importing it is enough
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: "[ngbNavOutlet]",
})
export class NavOutletItemsDirective implements AfterViewInit {
  private outlet = inject(NgbNavOutlet);
  // on the host of a component, this is the component's change detector
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  ngAfterViewInit() {
    this.outlet.nav.items.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.changeDetectorRef.markForCheck());
  }
}
