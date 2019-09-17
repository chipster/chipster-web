import { Component } from "@angular/core";
import { ManualBaseComponent } from "./manual-base.component";

@Component({
  selector: "ch-manual-div-component",
  template: "<div #element><ng-template #container></ng-template></div>"
})
export class ManualDivComponent extends ManualBaseComponent {}
