import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
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

  @Input()
  dataset: Dataset;

  ngOnInit(): void {
    this.sessionDataService.openNewTab(this.dataset);
  }
}
