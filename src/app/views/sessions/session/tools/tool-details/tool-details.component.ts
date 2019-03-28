import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { SessionData } from "../../../../../model/session/session-data";
import * as _ from "lodash";

@Component({
  selector: "ch-tool-details",
  templateUrl: "./tool-details.component.html",
  styleUrls: ["./tool-details.component.less"]
})
export class ToolDetailsComponent implements OnInit, OnDestroy {
  // FIXME after tool state refactoring
  // @Input() toolSelection: ToolSelection;
  @Input() sessionData: SessionData;
  @Input() selectedDatasets: Array<Dataset>;

  private unsubscribe: Subject<any> = new Subject();

  constructor() {}

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
