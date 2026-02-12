import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { TextVisualizationComponent } from "./text-visualization/text-visualization.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheet-visualization/spreadsheet-visualization.component";

@Component({
  selector: "ch-visualizationmodal",
  templateUrl: "./visualizationmodal.component.html",
  styleUrls: ["./visualizationmodal.component.less"],
  imports: [TextVisualizationComponent, SpreadsheetVisualizationComponent],
})
export class VisualizationModalComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  @Input() visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}
}
