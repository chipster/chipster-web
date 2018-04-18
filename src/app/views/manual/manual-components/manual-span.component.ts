import { Component } from '@angular/core';
import {ManualBaseComponent} from "./manual-base.component";

@Component({
  selector: 'ch-manual-div-component',
  template: '<span #element><ng-template #container></ng-template></span>'
})
export class ManualSpanComponent extends ManualBaseComponent {
}
