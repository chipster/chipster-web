import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Component, Input, AfterViewInit, ViewChild } from "@angular/core";

@Component({
  templateUrl: "./stringmodal.component.html"
})
export class StringModalComponent implements AfterViewInit {
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

  save() {
    this.activeModal.close(this.value);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
