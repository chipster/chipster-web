import { SessionDataService } from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import { SessionData } from "../../../../model/session/session-data";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from "@angular/core";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../../shared/resources/sessionworker.resource";
import { ToolSelectionService } from "../tool.selection.service";
import { Subject } from "rxjs/Subject";
import { ToolSelection } from "../tools/ToolSelection";
import Job from "../../../../model/session/job";
import { SettingsService } from "../../../../shared/services/settings.service";

@Component({
  selector: "ch-selection-panel",
  templateUrl: "./selection-panel.component.html",
  styleUrls: ["./selection-panel.component.less"]
})
export class SelectionPanelComponent implements OnInit, OnDestroy {
  @Input() sessionData: SessionData;

  public toolSelection: ToolSelection;
  public selectedDatasets: Array<Dataset>;
  public selectedJobs: Array<Job>;

  // a bit awkward to use enums in the template so going with these
  public showTool = false;
  public showFile = false;
  public showJob = false;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public selectionService: SelectionService,
    public sessionDataService: SessionDataService,
    private toolSelectionService: ToolSelectionService,
    public settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.toolSelectionService.toolSelection$
      .takeUntil(this.unsubscribe)
      .subscribe(toolSelection => {
        this.toolSelection = toolSelection;
        if (toolSelection) {
          this.showTool = true;
          this.showFile = false;
          this.showJob = false;
        }
      });

    this.selectionService.selectedDatasets$
      .takeUntil(this.unsubscribe)
      .subscribe((selectedDatasets: Array<Dataset>) => {
        this.selectedDatasets = selectedDatasets;
        if (this.selectedDatasets.length > 0) {
          this.showFile = true;
          this.showTool = false;
          this.showJob = false;
        } else {
          this.showFile = false;
          if (this.toolSelection) {
            this.showTool = true;
          }
        }
      });

    this.selectionService.selectedJobs$
      .takeUntil(this.unsubscribe)
      .subscribe((selectedJobs: Array<Job>) => {
        this.selectedJobs = selectedJobs;
        if (this.selectedJobs.length > 0) {
          this.showFile = false;
          this.showTool = false;
          this.showJob = true;
        } else {
          this.showJob = false;
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
