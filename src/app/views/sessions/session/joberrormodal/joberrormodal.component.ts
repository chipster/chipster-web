import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, Input} from '@angular/core';
import Job from 'chipster-js-common';

@Component({
  templateUrl: './joberrormodal.component.html'
})
export class JobErrorModalComponent {

  @Input() title: string;
  @Input() job: Job;

  constructor(
    private activeModal: NgbActiveModal) {}

  close() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
