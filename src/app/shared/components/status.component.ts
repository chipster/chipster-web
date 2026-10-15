import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LoadState, StatusButton } from "../../model/loadstate";

@Component({
  selector: "ch-status",
  template: `
    <div>{{ state.message }}</div>
    @for (button of state.buttons; track button.action; let first = $first) {
      <button class="btn btn-secondary btn-sm mt-3" [class.ms-2]="!first" (click)="onButton(button)">
        {{ button.text }}
      </button>
    }
  `,
  styles: [
    `
      div {
        font-style: italic;
      }
    `,
  ],
  standalone: false,
})
export class StatusComponent {
  @Input() state: LoadState;

  // emits the action of the clicked button
  @Output() buttonEvent = new EventEmitter<string>();

  onButton(button: StatusButton) {
    this.buttonEvent.emit(button.action);
  }
}
