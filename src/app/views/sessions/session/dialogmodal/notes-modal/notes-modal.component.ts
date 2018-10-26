import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  OnInit
} from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";

@Component({
  templateUrl: "./notes-modal.component.html",
  styleUrls: ["./notes-modal.component.less"]
})
export class NotesModalComponent implements AfterViewInit, OnInit {
  @Input()
  session: Session;

  @ViewChild("submitButton")
  submitButton;
  @ViewChild("notesArea")
  notesArea;

  public notes: string;
  public readOnly: boolean;

  constructor(
    private activeModal: NgbActiveModal,
    private sessionDataService: SessionDataService
  ) {}

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728

      if (this.readOnly) {
        this.submitButton.nativeElement.focus();
      } else {
        this.notesArea.nativeElement.focus();
      }
    });
  }

  ngOnInit() {
    this.notes = this.session.notes;
    this.readOnly = !this.sessionDataService.hasPersonalRule(
      this.session.rules
    );
  }

  save() {
    this.activeModal.close(this.notes);
  }

  cancel() {
    this.activeModal.dismiss();
  }

  getPlaceHolder() {
    return this.readOnly
      ? "You don't have permissions to add notes to this session"
      : "Add notes here";
  }
}
