import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, AfterViewInit, ViewChild } from "@angular/core";
import { Session } from "chipster-js-common";

@Component({
  templateUrl: "./notesmodal.component.html",
  styleUrls: ["./notesmodal.component.less"]
})
export class NotesModalComponent implements AfterViewInit {
  @Input()
  session: Session;

  @ViewChild("submitButton")
  submitButton;

  constructor(private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.submitButton.nativeElement.focus();
    });
  }

  save() {
    this.activeModal.close(this.session.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
