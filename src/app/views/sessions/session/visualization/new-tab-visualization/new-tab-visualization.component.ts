import { Component, OnInit, ChangeDetectionStrategy, inject, input } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";

@Component({
  selector: "ch-new-tab-visualization",
  templateUrl: "./new-tab-visualization.component.html",
  styleUrls: ["./new-tab-visualization.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NewTabVisualizationComponent implements OnInit {
  private sessionDataService = inject(SessionDataService);

  readonly dataset = input<Dataset>(undefined);

  ngOnInit(): void {
    this.sessionDataService.openNewTab(this.dataset());
  }
}
