import { Dataset, Tool } from "chipster-js-common";
import { Component, Input } from "@angular/core";
import { SessionData } from "../../../../../model/session/session-data";

@Component({
  selector: "ch-details-visualization",
  templateUrl: "./details-visualization.component.html",
})
export class DetailsVisualizationComponent {
  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];

  constructor() {}
}
