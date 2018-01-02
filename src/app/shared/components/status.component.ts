import {Component, Input} from "@angular/core";
import {LoadState} from "../../model/loadstate";

@Component({
  selector: 'ch-status',
  template: `
    <div>{{state.message}}</div>
  `,
  styles: [`
    div {
      font-style:italic;
    }
  `]
})

export class StatusComponent {
  @Input() private state: LoadState;
}
