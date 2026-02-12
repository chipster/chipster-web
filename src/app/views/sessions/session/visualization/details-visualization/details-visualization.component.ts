import { Component, Input } from "@angular/core";
import { Dataset, Tool } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { SingleDatasetComponent } from "../../selectiondetails/singledataset/single-dataset.component";
import { FilesDetailsComponent } from "../../selectiondetails/files-details.component.ts/files-details.component";

@Component({
  selector: "ch-details-visualization",
  templateUrl: "./details-visualization.component.html",
  imports: [SingleDatasetComponent, FilesDetailsComponent],
})
export class DetailsVisualizationComponent {
  @Input()
  datasets: Dataset[];
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];
}
