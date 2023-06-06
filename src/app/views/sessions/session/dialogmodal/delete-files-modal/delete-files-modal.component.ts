import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";

@Component({
  templateUrl: "./delete-files-modal.component.html",
})
export class DeleteFilesModalComponent {
  @Input()
  datasets: Dataset[];

  constructor(private activeModal: NgbActiveModal) {}

  delete() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
