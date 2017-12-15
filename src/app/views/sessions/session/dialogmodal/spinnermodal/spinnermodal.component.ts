import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";
import {ErrorService} from "../../../../error/error.service";
import {Observable} from "rxjs/Observable";

@Component({
  templateUrl: './spinnermodal.html'
})
export class SpinnerModalComponent implements AfterViewInit {

  @Input() message: string;
  @Input() observable: Observable<any>;

  constructor(
    private errorService: ErrorService,
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    this.observable.subscribe(() => {
      this.activeModal.close();
    }, err => {
      this.errorService.headerError('error while waiting for ' + this.message + ': ' + err, true);
      this.activeModal.dismiss();
    });
  }
}