import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PreModalComponent {
  @Input()
  title: string;

  @Input()
  text: string;

  constructor(private activeModal: NgbActiveModal) {}

  cancel() {
    this.activeModal.dismiss();
  }
}
