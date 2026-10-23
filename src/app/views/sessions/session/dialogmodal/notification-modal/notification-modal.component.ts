import { Component, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notification-modal.component.html",
})
export class NotificationModalComponent {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  readonly title = signal<string>(undefined);
  readonly message = signal<string>(undefined);

  close(): void {
    this.activeModal.dismiss();
  }
}
