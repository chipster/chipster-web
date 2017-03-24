import {Input, Component} from "@angular/core";
import {ToolSelection} from "./ToolSelection";

@Component({
  selector: 'ch-tool-title',
  template: `<span *ngIf="!toolSelection">No tool selected</span>
             <span *ngIf="toolSelection">{{toolSelection.module.name}} &#8594; {{toolSelection.category.name}} &#8594; {{toolSelection.tool.name.displayName}}</span>`
})
export class ToolTitleComponent {

  @Input() toolSelection: ToolSelection;

  constructor(){}

}
