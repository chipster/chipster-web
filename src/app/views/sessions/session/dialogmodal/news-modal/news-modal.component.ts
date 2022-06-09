import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./news-modal.component.html",
})
export class NewsModalComponent {
  constructor(private activeModal: NgbActiveModal) {}

  close(): void {
    this.activeModal.dismiss();
  }
}
