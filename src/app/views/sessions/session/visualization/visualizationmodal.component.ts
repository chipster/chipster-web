import { Component, Input, ChangeDetectionStrategy, forwardRef } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { TextVisualizationComponent } from "./text-visualization/text-visualization.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheet-visualization/spreadsheet-visualization.component";

@Component({
  selector: "ch-visualizationmodal",
  templateUrl: "./visualizationmodal.component.html",
  styleUrls: ["./visualizationmodal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  // forwardRef: these components inject VisualizationModalService, which imports this
  // modal to open it. In that import cycle they can be undefined here (NG0919)
  imports: [forwardRef(() => TextVisualizationComponent), forwardRef(() => SpreadsheetVisualizationComponent)],
})
export class VisualizationModalComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  @Input() visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}
}
