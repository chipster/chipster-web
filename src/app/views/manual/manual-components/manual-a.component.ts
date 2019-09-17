import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { ManualUtils } from "../manual-utils";
import { ManualBaseComponent } from "./manual-base.component";

@Component({
  selector: "ch-manual-a-component",
  template:
    '<a #element (click)="click()"><ng-template #container></ng-template></a>'
})
export class ManualAComponent extends ManualBaseComponent {
  constructor(private router: Router) {
    super();
  }

  getHref() {
    return this.elementViewContainerRef.element.nativeElement.getAttribute(
      "href"
    );
  }

  click() {
    console.log(this.getHref());

    if (ManualUtils.isAbsoluteUrl(this.getHref())) {
      // let the link navigate normally
      return true;
    } else {
      this.router.navigateByUrl(this.getHref());
      // prevent the page reload
      return false;
    }
  }
}
