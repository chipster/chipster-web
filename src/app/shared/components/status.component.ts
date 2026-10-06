import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LoadState } from "../../model/loadstate";

@Component({
  selector: "ch-status",
  template: `
    <div>{{ state.message }}</div>
    <button
      *ngFor="let buttonText of state.buttonTexts; let first = first"
      class="btn btn-secondary btn-sm mt-3"
      [class.ms-2]="!first"
      (click)="onButton(buttonText)">
      {{ buttonText }}
    </button>
  `,
  styles: [
    `
      div {
        font-style: italic;
      }
    `,
  ],
})
export class StatusComponent {
  @Input() state: LoadState;

  // emits the text of the clicked button
  @Output() buttonEvent = new EventEmitter<string>();

  onButton(buttonText: string) {
    this.buttonEvent.emit(buttonText);
  }
}
