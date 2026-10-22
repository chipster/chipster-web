import { Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notification-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotificationModalComponent {
  private activeModal = inject(NgbActiveModal);

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  title: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  message: string;

  close(): void {
    this.activeModal.dismiss();
  }
}
