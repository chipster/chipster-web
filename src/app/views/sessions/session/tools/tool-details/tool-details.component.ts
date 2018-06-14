import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../sessiondata.service";
import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import Job from "../../../../../model/session/job";
import { JobService } from "../../job.service";
import { SessionEventService } from "../../sessionevent.service";
import { Subject } from "rxjs/Subject";
import SessionEvent from "../../../../../model/events/sessionevent";
import { SessionData } from "../../../../../model/session/session-data";
import * as _ from "lodash";
import { SelectionHandlerService } from "../../selection-handler.service";
import Dataset from "../../../../../model/session/dataset";
import { ToolSelection } from "../ToolSelection";

@Component({
  selector: "ch-tool-details",
  templateUrl: "./tool-details.component.html",
  styleUrls: ["./tool-details.component.less"]
})
export class ToolDetailsComponent implements OnInit, OnDestroy {
  @Input() toolSelection: ToolSelection;
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
