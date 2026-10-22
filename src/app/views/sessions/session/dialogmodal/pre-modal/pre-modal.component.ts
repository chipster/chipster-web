import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PreModalComponent {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  title = signal<string>(undefined);

  text = signal<string>(undefined);

  cancel() {
    this.activeModal.dismiss();
  }
}
