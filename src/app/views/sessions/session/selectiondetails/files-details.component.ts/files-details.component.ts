import { Component, Input } from "@angular/core";
import { Dataset, Label } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { getSortedLabels } from "../../labels/labels-util";

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
    return getSortedLabels(dataset.labelIds, this.sessionData.labelsMap);
  }
}
