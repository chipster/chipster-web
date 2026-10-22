import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PreModalComponent {
  private activeModal = inject(NgbActiveModal);

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  title: string;

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  text: string;

  cancel() {
    this.activeModal.dismiss();
  }
}
