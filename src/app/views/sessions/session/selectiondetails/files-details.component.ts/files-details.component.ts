import { Component, ChangeDetectionStrategy, input } from "@angular/core";
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
  readonly datasets = input<Dataset[]>(undefined);
  readonly showDate = input<boolean>(true);
  readonly sessionData = input<SessionData>(undefined);

  labelsFor(dataset: Dataset): Label[] {
    const sessionData = this.sessionData();
    if (!sessionData) {
      return [];
    }
    return getSortedLabels(dataset.labelIds, sessionData.labelsMap);
  }
}
