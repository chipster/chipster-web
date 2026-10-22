import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";

@Component({
  templateUrl: "./delete-files-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DeleteFilesModalComponent {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  readonly datasets = signal<Dataset[]>(undefined);

  delete() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
