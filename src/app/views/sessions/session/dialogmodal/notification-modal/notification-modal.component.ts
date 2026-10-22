import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notification-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotificationModalComponent {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  title = signal<string>(undefined);
  message = signal<string>(undefined);

  close(): void {
    this.activeModal.dismiss();
  }
}
