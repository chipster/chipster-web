import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  OnInit
} from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";

@Component({
  templateUrl: "./pre-modal.component.html",
  styleUrls: ["./pre-modal.component.less"]
})
export class PreModalComponent {
  @Input()
  title: string;

  @Input()
  text: string;

  constructor(private activeModal: NgbActiveModal) {}

  cancel() {
    this.activeModal.dismiss();
  }
}
