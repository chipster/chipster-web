import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input} from "@angular/core";

@Component({
  templateUrl: './joberrormodal.html'
})
export class JobErrorModalComponent {

  @Input() title: string;
  @Input() job: string;

  constructor(
    private activeModal: NgbActiveModal) {}

  close() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
