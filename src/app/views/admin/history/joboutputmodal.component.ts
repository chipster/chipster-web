import { Component, Input } from "@angular/core";
import { NgbModal, NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "ch-joboutput-modal-content",
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Job Output</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <pre>{{ output }}</pre>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-dark" (click)="activeModal.close('Close click')">Close</button>
    </div>
  `,
})
export class JobOutputModalComponent {
  @Input() output;

  constructor(public activeModal: NgbActiveModal) {
    console.log(this.output);
  }
}
