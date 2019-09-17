import { Component } from "@angular/core";
import { ManualBaseComponent } from "./manual-base.component";

@Component({
  selector: "ch-manual-p-component",
  template: "<p #element><ng-template #container></ng-template></p>"
})
export class ManualPComponent extends ManualBaseComponent {}
