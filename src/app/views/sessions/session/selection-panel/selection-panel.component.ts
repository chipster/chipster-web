import { SessionDataService } from "../session-data.service";
import { Dataset, Tool } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { SelectionService } from "../selection.service";
import * as _ from "lodash";
import { ToolSelectionService } from "../tool.selection.service";
import { Subject } from "rxjs/Subject";
import { Job } from "chipster-js-common";
import { SettingsService } from "../../../../shared/services/settings.service";
import { ErrorService } from "../../../../core/errorhandler/error.service";

@Component({
  selector: "ch-selection-panel",
  templateUrl: "./selection-panel.component.html",
  styleUrls: ["./selection-panel.component.less"]
})
export class SelectionPanelComponent implements OnInit, OnDestroy {
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];

  // FIXME after tool state refactoring
  // public toolSelection: ToolSelection;
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
    public settingsService: SettingsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    // FIXME after tool selection refactoring
    // this.toolSelectionService.toolSelection$
    //   .takeUntil(this.unsubscribe)
    //   .subscribe(toolSelection => {
    //     this.toolSelection = toolSelection;
    //     if (toolSelection) {
    //       this.showTool = true;
    //       this.showFile = false;
    //       this.showJob = false;
    //     }
    //   }, err => this.errorService.showError("tool selection failed", err));

    // this.selectionService.selectedDatasets$
    //   .takeUntil(this.unsubscribe)
    //   .subscribe(
    //     (selectedDatasets: Array<Dataset>) => {
    //       this.selectedDatasets = selectedDatasets;
    //       if (this.selectedDatasets.length > 0) {
    //         this.showFile = true;
    //         this.showTool = false;
    //         this.showJob = false;
    //       } else {
    //         this.showFile = false;
    //         if (this.toolSelection) {
    //           this.showTool = true;
    //         }
    //       }
    //     },
    //     err => this.errorService.showError("dataset selection failed", err)
    //   );

    this.selectionService.selectedJobs$.takeUntil(this.unsubscribe).subscribe(
      (selectedJobs: Array<Job>) => {
        this.selectedJobs = selectedJobs;
        if (this.selectedJobs.length > 0) {
          this.showFile = false;
          this.showTool = false;
          this.showJob = true;
        } else {
          this.showJob = false;
        }
      },
      err => this.errorService.showError("job selection failed", err)
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
