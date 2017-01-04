import {Input, Component} from "@angular/core";

@Component({
  selector: 'ch-tool-title',
  template: `<h5>{{module}} &#8594; {{category}} &#8594; {{tool}}</h5>`
})
export class ToolTitleComponent {

  @Input() module: string;
  @Input() category: string;
  @Input() tool: string;

  constructor(){}

  ngOnInit() {

  }

}
