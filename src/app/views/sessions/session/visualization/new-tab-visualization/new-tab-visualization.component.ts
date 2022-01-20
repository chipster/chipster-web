import { Component, Input, OnInit } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";

@Component({
  selector: "ch-new-tab-visualization",
  templateUrl: "./new-tab-visualization.component.html",
  styleUrls: ["./new-tab-visualization.component.less"],
})
export class NewTabVisualizationComponent implements OnInit {
  @Input()
  dataset: Dataset;

  constructor(private sessionDataService: SessionDataService) {}

  ngOnInit(): void {
    this.sessionDataService.openNewTab(this.dataset);
  }
}
