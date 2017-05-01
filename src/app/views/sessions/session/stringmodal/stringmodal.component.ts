import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit, ViewChild} from "@angular/core";

@Component({
  templateUrl: './stringmodal.html'
})
export class StringModalComponent implements AfterViewInit {

  @Input() buttonText: string;
  @Input() description: string;
  @Input() value: string;
  @Input() title: string;

  @ViewChild('valueInput') valueInput;

  constructor(
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    this.valueInput.nativeElement.focus();
  }

  save() {
    /* a weird workaround for a weird bug: the modal doesn't close if it's opened from the <button> AND
       closed with enter. Everything else works, like opening from <span> or closing by a mouse click.
       I have no idea what's happening here or why setTimeout fixes it. */
    setTimeout(() => {
      this.activeModal.close(this.value);
    }, 0);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
