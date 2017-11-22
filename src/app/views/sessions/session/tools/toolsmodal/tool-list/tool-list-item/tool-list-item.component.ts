import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'ch-tool-list-item',
  template: `
    <span><span class="circle" [ngStyle]="{'background-color': color}"></span> {{categoryname}}</span>
  `,
  styles: [`
    .circle {
        border-radius: 50%;
        height: 5px;
        width: 5px;
        display: inline-block;
        margin-bottom: 3px;
    }
  `],
})
export class ToolListItemComponent implements OnInit {

  @Input() color: string;
  @Input() categoryname: string;

  constructor() { }

  ngOnInit() {}

}
