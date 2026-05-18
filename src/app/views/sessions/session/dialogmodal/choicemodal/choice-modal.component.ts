import { AfterViewInit, Component, Input, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./choice-modal.component.html",
})
export class ChoiceModalComponent implements AfterViewInit {
  @Input() title: string;
  @Input() message: string;
  @Input() action1ButtonText: string;
  @Input() action1Disabled = false;
  @Input() action2ButtonText: string;
  @Input() action2Disabled = false;
  @Input() action3ButtonText: string;
  @Input() action3Disabled = false;
  @Input() cancelButtonText: string;
  @Input() question: string;

  @ViewChild("submitButton") submitButton;

  constructor(private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    setTimeout(() => this.submitButton.nativeElement.focus());
  }

  action1() {
    this.activeModal.close(1);
  }

  action2() {
    this.activeModal.close(2);
  }

  action3() {
    this.activeModal.close(3);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
