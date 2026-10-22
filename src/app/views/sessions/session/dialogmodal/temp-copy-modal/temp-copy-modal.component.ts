import { AfterViewInit, Component, ChangeDetectionStrategy, inject, signal, viewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";

@Component({
  templateUrl: "./temp-copy-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
})
export class TempCopyModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  button1Text = signal<string>(undefined);
  button2Text = signal<string>(undefined);
  description = signal<string>(undefined);
  value = signal<string>(undefined);
  title = signal<string>(undefined);
  message = signal<string>(undefined);
  placeHolder = signal<string>(undefined);

  readonly valueInput = viewChild("valueInput");

  ngAfterViewInit() {
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.valueInput().nativeElement.focus();
      this.valueInput().nativeElement.select();
    });
  }

  save(button: string) {
    this.activeModal.close({
      value: this.value(),
      button,
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
