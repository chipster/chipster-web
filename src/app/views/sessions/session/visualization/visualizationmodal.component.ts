import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";

@Component({
  selector: "ch-visualizationmodal",
  templateUrl: "./visualizationmodal.component.html",
  styleUrls: ["./visualizationmodal.component.less"],
})
export class VisualizationModalComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  @Input() visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}
}
