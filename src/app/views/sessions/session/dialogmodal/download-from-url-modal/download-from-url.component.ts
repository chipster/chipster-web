import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./download-from-url.component.html",
})
export class DownloadFromUrlModalComponent {
  value = "";
  placeHolder = "https://example.com/example.tsv";

  constructor(private activeModal: NgbActiveModal) {}

  save($event): void {
    this.activeModal.close(this.value);
    if ($event) {
      // otherwise the event may open the dialog again, when the original button
      // gets it(New session button in session list in Chrome with an enter key event)
      $event.preventDefault();
    }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
