import { AfterViewInit, Component, Input, ViewChild, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";

@Component({
  templateUrl: "./temp-copy-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
})
export class TempCopyModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  button1Text: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  button2Text: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  description: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  value: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  title: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  message: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  placeHolder: string;

  @ViewChild("valueInput")
  valueInput;

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
      button,
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
