import { AfterViewInit, Component, Input, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./choice-modal.component.html",
})
export class ChoiceModalComponent implements AfterViewInit {
  @Input() title: string;
  @Input() message: string;
  @Input() action1ButtonText: string;
  @Input() action2ButtonText: string;
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

  cancel() {
    this.activeModal.dismiss();
  }
}
