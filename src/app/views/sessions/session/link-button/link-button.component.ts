import { Component } from "@angular/core";

/**
 * Link that looks like a link, but doesn't navigate
 *
 * A links looks like a link (the color and hover) only when it has a href attribute, but then
 * the link also navigates when being clicked. Bootstrap has btn-lnk style for the same purpose,
 * but it leaves ugly focus border after being clicked (at least on Chrome).
 */
@Component({
  selector: "ch-link-button",
  template: '<a style="text-decoration-line: none;" href="javascript:void(0)" #anchor><ng-content></ng-content></a>',
})
export class LinkButtonComponent {
  constructor() {}
}
