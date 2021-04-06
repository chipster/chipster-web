import { Component, Input, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { SessionData } from "../../../../../model/session/session-data";

@Component({
  selector: "ch-tool-details",
  templateUrl: "./tool-details.component.html",
  styleUrls: ["./tool-details.component.less"],
})
export class ToolDetailsComponent implements OnDestroy {
  // FIXME after tool state refactoring
  // @Input() toolSelection: ToolSelection;
  @Input() sessionData: SessionData;
  @Input() selectedDatasets: Array<Dataset>;

  private unsubscribe: Subject<any> = new Subject();

  constructor() {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
