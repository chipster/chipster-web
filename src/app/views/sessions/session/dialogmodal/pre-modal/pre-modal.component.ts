import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PreModalComponent {
  private activeModal = inject(NgbActiveModal);

  @Input()
  title: string;

  @Input()
  text: string;

  cancel() {
    this.activeModal.dismiss();
  }
}
