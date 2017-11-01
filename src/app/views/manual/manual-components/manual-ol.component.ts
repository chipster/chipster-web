import {Component} from '@angular/core'
import {ManualBaseComponent} from "./manual-base.component";

@Component({
  selector: 'ch-manual-ol-component',
  template: '<ol #element><ng-template #container></ng-template></ol>'
})
export class ManualOlComponent extends ManualBaseComponent {
}
