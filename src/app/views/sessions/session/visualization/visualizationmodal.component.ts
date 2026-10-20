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
  // forwardRef for every import in an import cycle with this component (the modal
  // services import the modals to open them): which of them is still undefined when
  // this decorator runs depends on the bundler, so all of them get it (NG0919)
  imports: [forwardRef(() => TextVisualizationComponent), forwardRef(() => SpreadsheetVisualizationComponent)],
})
export class VisualizationModalComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  @Input() visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}
}
