import { Component, computed, input } from "@angular/core";
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
  imports: [LabelPillComponent, BytesPipe, LocalDatePipe],
})
export class FilesDetailsComponent {
  readonly datasets = input<Dataset[]>(undefined);
  readonly showDate = input<boolean>(true);
  readonly sessionData = input<SessionData>(undefined);

  /*
   * The latest copies from datasetsMap, because the datasets of the selection aren't updated by the
   * dataset events. Without sessionData, as in the Venn diagram, the datasets as they are.
   */
  readonly latestDatasets = computed(() => {
    const datasetsMap = this.sessionData()?.datasetsMap();
    return this.datasets().map((d) => datasetsMap?.get(d.datasetId) ?? d);
  });

  labelsFor(dataset: Dataset): Label[] {
    const sessionData = this.sessionData();
    if (!sessionData) {
      return [];
    }
    return getSortedLabels(dataset.labelIds, sessionData.labelsMap());
  }
}
