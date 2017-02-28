import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, AfterViewInit} from "@angular/core";
import {ViewChild} from "@angular/core/src/metadata/di";

@Component({
  templateUrl: './sessionnamemodal.html'
})
export class SessionNameModalComponent implements AfterViewInit {

  @Input() name: string;
  @Input() title: string;

  @ViewChild('nameInput') nameInput;

  constructor(
    private activeModal: NgbActiveModal) {}

  ngAfterViewInit() {
    this.nameInput.nativeElement.focus();
  }

  save() {
    /* a weird workaround for a weird bug: the modal doesn't close if it's opened from the <button> AND
       closed with enter. Everything else works, like opening from <span> or closing by a mouse click.
       I have no idea what's happening here or why setTimeout fixes it. */
    setTimeout(() => {
      this.activeModal.close(this.name);
    }, 0);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
