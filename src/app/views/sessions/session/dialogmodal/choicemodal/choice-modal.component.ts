import { AfterViewInit, Component, inject, signal, viewChild, ElementRef } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./choice-modal.component.html",
})
export class ChoiceModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  readonly title = signal<string>(undefined);
  readonly message = signal<string>(undefined);
  readonly action1ButtonText = signal<string>(undefined);
  readonly action1Disabled = signal(false);
  readonly action2ButtonText = signal<string>(undefined);
  readonly action2Disabled = signal(false);
  readonly action3ButtonText = signal<string>(undefined);
  readonly action3Disabled = signal(false);
  readonly cancelButtonText = signal<string>(undefined);
  readonly question = signal<string>(undefined);

  readonly submitButton = viewChild<ElementRef<HTMLButtonElement>>("submitButton");

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
