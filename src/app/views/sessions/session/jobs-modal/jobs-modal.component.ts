import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Job, Tool } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { SelectionHandlerService } from "../selection-handler.service";

@Component({
  selector: "ch-jobs-modal",
  templateUrl: "./jobs-modal.component.html",
  styleUrls: ["./jobs-modal.component.less"],
})
export class JobsModalComponent {
  constructor(public activeModal: NgbActiveModal, private selectionHandlerService: SelectionHandlerService) {}

  @Input() jobs: Job[];
  @Input() tools: Tool[];
  @Input() sessionData: SessionData;

  /**
   * Job selection goes through selectionHandlerService, bit overkill atm.
   *
   * @param job
   *
   */
  onJobSelection(job: Job) {
    this.selectionHandlerService.setJobSelection([job]);
  }
}
