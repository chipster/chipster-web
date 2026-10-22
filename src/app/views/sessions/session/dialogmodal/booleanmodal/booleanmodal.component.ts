import { AfterViewInit, Component, Input, ViewChild, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./booleanmodal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BooleanModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  okButtonText: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  okButtonClass: string = "btn-info";
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  cancelButtonText: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  message: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  subMessage: string = null;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  title: string;

  @ViewChild("submitButton")
  submitButton;

  ngAfterViewInit() {
    // set focus to submit button every time the dialog is opened
    // autofocus attribute would work only once when the component is created
    setTimeout(() => {
      // needs setTimeout or the page scrolls to the bottom
      // should be fixed in ng-bootstrap 3.3.0
      // https://github.com/ng-bootstrap/ng-bootstrap/issues/1776
      // https:github.com/ng-bootstrap/ng-bootstrap/issues/2728
      this.submitButton.nativeElement.focus();
    });
  }

  save() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
