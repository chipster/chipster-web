import { Component, Input } from "@angular/core";
import { Dataset, Label } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";

@Component({
  selector: "ch-files-details",
  templateUrl: "./files-details.component.html",
  styleUrls: ["./files-details.component.less"],
})
export class FilesDetailsComponent {
  @Input()
  datasets: Dataset[];
  @Input()
  showDate: boolean = true;
  @Input()
  sessionData: SessionData;

  labelsFor(dataset: Dataset): Label[] {
    if (!this.sessionData) {
      return [];
    }
    return (dataset.labelIds ?? [])
      .map((id) => this.sessionData.labelsMap.get(id))
      .filter((t) => t != null);
  }
}
