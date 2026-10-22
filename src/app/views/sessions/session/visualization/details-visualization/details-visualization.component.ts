import { Component, Input, ChangeDetectionStrategy, input } from "@angular/core";
import { Dataset, Tool } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { SingleDatasetComponent } from "../../selectiondetails/singledataset/single-dataset.component";
import { FilesDetailsComponent } from "../../selectiondetails/files-details.component.ts/files-details.component";

@Component({
  selector: "ch-details-visualization",
  templateUrl: "./details-visualization.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SingleDatasetComponent, FilesDetailsComponent],
})
export class DetailsVisualizationComponent {
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input()
  datasets: Dataset[];
  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);
}
