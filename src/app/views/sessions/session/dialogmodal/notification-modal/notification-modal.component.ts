import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./notification-modal.component.html",
})
export class NotificationModalComponent {
  @Input()
  title: string;
  @Input()
  message: string;

  constructor(private activeModal: NgbActiveModal) {}

  close(): void {
    this.activeModal.dismiss();
  }
}
