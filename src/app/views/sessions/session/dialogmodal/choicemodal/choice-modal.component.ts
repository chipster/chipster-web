import { AfterViewInit, Component, ChangeDetectionStrategy, inject, signal, viewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./choice-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ChoiceModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  title = signal<string>(undefined);
  message = signal<string>(undefined);
  action1ButtonText = signal<string>(undefined);
  action1Disabled = signal(false);
  action2ButtonText = signal<string>(undefined);
  action2Disabled = signal(false);
  action3ButtonText = signal<string>(undefined);
  action3Disabled = signal(false);
  cancelButtonText = signal<string>(undefined);
  question = signal<string>(undefined);

  readonly submitButton = viewChild("submitButton");

  ngAfterViewInit() {
    setTimeout(() => this.submitButton().nativeElement.focus());
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
