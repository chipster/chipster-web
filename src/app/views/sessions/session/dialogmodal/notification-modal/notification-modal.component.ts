import { Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notification-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotificationModalComponent {
  private activeModal = inject(NgbActiveModal);

  @Input()
  title: string;
  @Input()
  message: string;

  close(): void {
    this.activeModal.dismiss();
  }
}
