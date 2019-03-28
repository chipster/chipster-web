import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";
import {ErrorService} from "../../../../../core/errorhandler/error.service";
import {Observable} from "rxjs";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  templateUrl: './spinnermodal.html'
})
export class SpinnerModalComponent implements AfterViewInit {

  @Input() message: string;
  @Input() observable: Observable<any>;

  constructor(
    private activeModal: NgbActiveModal,
    private restErrorService: RestErrorService,
  ) { }

  ngAfterViewInit() {
    this.observable.subscribe(() => {
      this.activeModal.close();
    }, err => {
      this.restErrorService.showError(this.message  + " failed", err);
      this.activeModal.dismiss();
    });
  }
}
