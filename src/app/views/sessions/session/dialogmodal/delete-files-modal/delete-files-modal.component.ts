import { Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";

@Component({
  templateUrl: "./delete-files-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DeleteFilesModalComponent {
  private activeModal = inject(NgbActiveModal);

  @Input()
  datasets: Dataset[];

  delete() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
