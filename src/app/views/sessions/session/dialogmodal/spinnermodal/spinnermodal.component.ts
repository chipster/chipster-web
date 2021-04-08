import { AfterViewInit, Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable } from "rxjs";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  templateUrl: "./spinnermodal.html",
})
export class SpinnerModalComponent implements AfterViewInit {
  @Input() message: string;
  @Input() observable: Observable<any>;

  constructor(
    private activeModal: NgbActiveModal,
    private restErrorService: RestErrorService
  ) {}

  ngAfterViewInit() {
    this.observable.subscribe(
      (result) => {
        this.activeModal.close(result);
      },
      (err) => {
        this.restErrorService.showError(this.message + " failed", err);
        this.activeModal.dismiss();
      }
    );
  }
}
