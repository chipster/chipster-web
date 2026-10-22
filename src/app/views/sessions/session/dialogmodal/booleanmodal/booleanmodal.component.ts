import {
  AfterViewInit,
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  ElementRef,
} from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./booleanmodal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BooleanModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  okButtonText = signal<string>(undefined);
  okButtonClass = signal<string>("btn-info");
  cancelButtonText = signal<string>(undefined);
  message = signal<string>(undefined);
  subMessage = signal<string>(null);
  title = signal<string>(undefined);

  readonly submitButton = viewChild<ElementRef<HTMLButtonElement>>("submitButton");

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.submitButton().nativeElement.focus();
    });
  }

  save() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
