import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LoadState } from "../../model/loadstate";

@Component({
  selector: "ch-status",
  template: `
    <div>{{ state.message }}</div>
    <button *ngIf="state.buttonText" class="btn btn-info btn-sm" (click)="onButton()">{{state.buttonText}}</button>
  `,
  styles: [
    `
      div {
        font-style: italic;
      }
    `
  ]
})
export class StatusComponent {  
  
  @Input() state: LoadState;

  @Output() buttonEvent = new EventEmitter<void>();

  onButton() {
    this.buttonEvent.emit();
  }
}
