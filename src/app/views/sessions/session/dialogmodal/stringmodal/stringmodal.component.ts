import { AfterViewInit, Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./stringmodal.component.html",
})
export class StringModalComponent implements AfterViewInit, OnInit {
  @Input()
  buttonText: string;
  @Input()
  description: string;
  @Input()
  value: string;
  @Input()
  title: string;
  @Input()
  placeHolder: string;

  // optional checkbox shown below the input. Render only when checkboxLabel is set.
  @Input() checkboxLabel: string = null;
  @Input() checkboxInitial = true;
  @Input() checkboxDisabled = false;
  checkboxValue = true;

  @ViewChild("valueInput")
  valueInput;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.checkboxValue = this.checkboxInitial;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.valueInput.nativeElement.focus();
      this.valueInput.nativeElement.select();
    });
  }

  save($event) {
    this.activeModal.close(this.value);
    if ($event) {
      // otherwise the event may open the dialog again, when the original button
      // gets it(New session button in session list in Chrome with an enter key event)
      $event.preventDefault();
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
