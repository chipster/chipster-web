import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";

@Component({
  templateUrl: './temp-copy-modal.component.html'
})
export class TempCopyModalComponent implements AfterViewInit {

  @Input() button1Text: string;
  @Input() button2Text: string;
  @Input() description: string;
  @Input() value: string;
  @Input() title: string;
  @Input() message: string;
  @Input() placeHolder: string;

  @ViewChild('valueInput') valueInput;

  constructor(
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    this.valueInput.nativeElement.focus();
    setTimeout(() => this.valueInput.nativeElement.select());
  }

  save(button: string) {
    console.log('save()', button, this.value);
    this.activeModal.close({
      value: this.value,
      button: button
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
