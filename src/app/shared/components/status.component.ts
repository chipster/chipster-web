import {Component, Input} from "@angular/core";

@Component({
  selector: 'ch-status',
  template: `
    <div>{{status}}</div>
  `,
  styles: [`
    div {
      font-style:italic;
    }
  `]
})

export class StatusComponent {
  @Input() private status: string;
}
