import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";
import { Session } from "chipster-js-common";

@Component({
  templateUrl: './notesmodal.component.html',
  styleUrls: ['./notesmodal.component.less']
})
export class NotesModalComponent implements AfterViewInit{

  @Input() session: Session;

  @ViewChild('submitButton') submitButton;

  constructor(
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    this.submitButton.nativeElement.focus();
  }

  save() {
    this.activeModal.close(this.session.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
