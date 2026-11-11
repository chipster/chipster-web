import { Component, OnDestroy, input } from "@angular/core";
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
  readonly sessionData = input<SessionData>(undefined);
  readonly selectedDatasets = input<Array<Dataset>>(undefined);

  private unsubscribe: Subject<any> = new Subject();

  constructor() {}

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
