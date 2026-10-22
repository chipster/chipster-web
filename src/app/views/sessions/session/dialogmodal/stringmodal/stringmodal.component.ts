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
import { FormsModule } from "@angular/forms";

@Component({
  templateUrl: "./stringmodal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
})
export class StringModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  readonly buttonText = signal<string>(undefined);
  readonly description = signal<string>(undefined);
  readonly value = signal<string>(undefined);
  readonly title = signal<string>(undefined);
  readonly placeHolder = signal<string>(undefined);

  readonly valueInput = viewChild<ElementRef<HTMLInputElement>>("valueInput");

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

  save($event) {
    this.activeModal.close(this.value());
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
