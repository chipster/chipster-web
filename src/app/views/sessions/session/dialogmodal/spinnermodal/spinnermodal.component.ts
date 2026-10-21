import { AfterViewInit, Component, Input, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable } from "rxjs";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  templateUrl: "./spinnermodal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SpinnerModalComponent implements AfterViewInit {
  private activeModal = inject(NgbActiveModal);
  private restErrorService = inject(RestErrorService);

  @Input() message: string;
  @Input() observable: Observable<any>;

  ngAfterViewInit() {
    this.observable.subscribe({
      next: (result) => {
        this.activeModal.close(result);
      },
      error: (err) => {
        this.restErrorService.showError(`${this.message} failed`, err);
        this.activeModal.dismiss();
      },
    });
  }
}
