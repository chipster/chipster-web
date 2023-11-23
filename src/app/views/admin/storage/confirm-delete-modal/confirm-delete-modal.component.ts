import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "ch-confirm-delete-modal",
  templateUrl: "./confirm-delete-modal.component.html",
  styleUrls: ["./confirm-delete-modal.component.less"],
})
export class ConfirmDeleteModalComponent {
  constructor(public activeModal: NgbActiveModal) {}

  @Input() title: string;
  @Input() message: string;
  @Input() users: any[];
}
