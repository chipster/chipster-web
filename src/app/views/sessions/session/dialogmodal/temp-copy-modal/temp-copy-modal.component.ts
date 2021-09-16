import { AfterViewInit, Component, Input, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./temp-copy-modal.component.html",
})
export class TempCopyModalComponent implements AfterViewInit {
  @Input()
  button1Text: string;
  @Input()
  button2Text: string;
  @Input()
  description: string;
  @Input()
  value: string;
  @Input()
  title: string;
  @Input()
  message: string;
  @Input()
  placeHolder: string;

  @ViewChild("valueInput")
  valueInput;

  constructor(private activeModal: NgbActiveModal) {}

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

  save(button: string) {
    this.activeModal.close({
      value: this.value,
      button: button,
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
