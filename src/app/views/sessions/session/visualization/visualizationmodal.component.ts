import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";

@Component({
  selector: "ch-visualizationmodal",
  templateUrl: "./visualizationmodal.component.html",
  styleUrls: ["./visualizationmodal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class VisualizationModalComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  @Input() visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}
}
