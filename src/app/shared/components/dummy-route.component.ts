import { Component } from "@angular/core";
/**
 * Dummy component which can be used as a target component for such a route, which
 * is guarded so that the guard always navigates elsewhere. So this component is
 * actually never loaded.
 */
@Component({
  template: `
    <div>This is a dummy page, nothing interesting here.</div>
  `
})
export class DummyRouteComponent {}
