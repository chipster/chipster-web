import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { Dataset, Label } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { getSortedLabels } from "../../labels/labels-util";
import { LabelPillComponent } from "../../labels/label-pill.component";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-files-details",
  templateUrl: "./files-details.component.html",
  styleUrls: ["./files-details.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LabelPillComponent, BytesPipe, LocalDatePipe],
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
