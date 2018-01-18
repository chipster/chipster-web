import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";

@Component({
  templateUrl: './stringmodal.html'
})
export class StringModalComponent implements AfterViewInit {

  @Input() buttonText: string;
  @Input() cancelButtonText: string;
  @Input() description: string;
  @Input() value: string;
  @Input() title: string;
  @Input() message: string;

  @ViewChild('valueInput') valueInput;

  constructor(
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    this.valueInput.nativeElement.focus();
  }

  save() {
    this.activeModal.close(this.value);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
