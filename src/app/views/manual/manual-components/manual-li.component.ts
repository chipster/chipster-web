import { Component } from '@angular/core';
import {ManualBaseComponent} from "./manual-base.component";

@Component({
  selector: 'ch-manual-li-component',
  template: '<li #element><ng-template #container></ng-template></li>'
})
export class ManualLiComponent extends ManualBaseComponent {
}
