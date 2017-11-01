import {Component} from '@angular/core'
import {ManualBaseComponent} from "./manual-base.component";

@Component({
  selector: 'ch-manual-ul-component',
  template: '<ul #element><ng-template #container></ng-template></ul>'
})
export class ManualUlComponent extends ManualBaseComponent {
}
