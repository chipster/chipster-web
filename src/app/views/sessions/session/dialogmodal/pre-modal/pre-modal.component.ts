import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, inject, signal } from "@angular/core";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"],
})
export class PreModalComponent {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  readonly title = signal<string>(undefined);

  readonly text = signal<string>(undefined);

  cancel() {
    this.activeModal.dismiss();
  }
}
