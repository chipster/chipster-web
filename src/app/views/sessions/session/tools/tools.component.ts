import { ToolService } from "./tool.service";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import { SelectionService } from "../selection.service";
import { Component, Input, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { ToolSelection } from "./ToolSelection";
import { Store } from "@ngrx/store";
import { Subject } from "rxjs/Subject";
import { SET_TOOL_SELECTION } from "../../../../state/selected-tool.reducer";
import { SessionData } from "../../../../model/session/session-data";
import { ToolSelectionService } from "../tool.selection.service";
import { NgbDropdown, NgbDropdownConfig } from "@ng-bootstrap/ng-bootstrap";
import UtilsService from "../../../../shared/utilities/utils";
import { SessionEventService } from "../sessionevent.service";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import InputBinding from "../../../../model/session/inputbinding";

@Component({
  selector: "ch-tools",
  templateUrl: "./tools.component.html",
  styleUrls: ["./tools.component.less"],
  providers: [NgbDropdownConfig]
})
export class ToolsComponent implements OnInit, OnDestroy {
  @Input() sessionData: SessionData;

  @ViewChild("toolsDropdown") public toolsDropdown: NgbDropdown;

  runningJobs = 0;
  jobList: Job[];

  // initialization
  toolSelection: ToolSelection = null;

  toolSelection$ = new Subject();

  selectedDatasets: Dataset[] = [];

  subscriptions: Array<any> = [];

  constructor(
    private selectionService: SelectionService,
    private selectionHandlerService: SelectionHandlerService,
    public toolSelectionService: ToolSelectionService,
    private toolService: ToolService,
    private store: Store<any>,
    private sessionEventService: SessionEventService,
    private jobService: JobService,
    dropdownConfig: NgbDropdownConfig
  ) {
    // close only on outside click
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit() {
    this.updateJobs();

    this.selectedDatasets = this.selectionService.selectedDatasets;

    this.toolSelection$
      .map((toolSelection: ToolSelection) => ({
        type: SET_TOOL_SELECTION,
        payload: toolSelection
      }))
      .subscribe(this.store.dispatch.bind(this.store));

    this.subscriptions.push(
      this.store.select("toolSelection").subscribe(
        (toolSelection: ToolSelection) => {
          this.toolSelection = toolSelection;
        },
        (error: any) => {
          console.error("Fetching tool from store failed", error);
        }
      )
    );

    // fetch selectedDatasets from store and if tool is selected update it's inputbindings and update store
    this.subscriptions.push(
      this.store.select("selectedDatasets").subscribe(
        (selectedDatasets: Array<Dataset>) => {
          this.selectedDatasets = selectedDatasets;
          if (this.toolSelection) {
            const updatedInputBindings = this.toolService.bindInputs(
              this.sessionData,
              this.toolSelection.tool,
              this.selectionService.selectedDatasets
            );
            const newToolSelection = Object.assign({}, this.toolSelection, {
              inputBindings: updatedInputBindings
            });
            this.toolSelection$.next(newToolSelection);
          }
        },
        (error: any) => {
          console.error("Fetching selected datasets from store failed", error);
        }
      )
    );

    // trigger parameter validation
    if (this.toolSelection) {
      this.selectTool(this.toolSelection);
    }

    this.subscriptions.push(
      this.sessionEventService.getJobStream().subscribe(() => {
        this.updateJobs();
      })
    );
  }

  selectTool(toolSelection: ToolSelection) {
    // // TODO reset col_sel and metacol_sel if selected dataset has changed
    // for (let param of tool.parameters) {
    //   this.populateParameterValues(param);
    // }

    // this component knows the selected datasets, so we can create input bindings
    toolSelection.inputBindings = this.toolService.bindInputs(
      this.sessionData,
      toolSelection.tool,
      this.selectedDatasets
    );

    this.toolSelection$.next(toolSelection);
    this.toolsDropdown.close();
  }

  onJobSelection(job: Job) {
    this.selectionHandlerService.setJobSelection([job]);
  }

  getManualPage() {
    const tool: string = this.toolSelection.tool.name.id;

    if (tool.endsWith(".java")) {
      // remove the java package name
      const splitted = tool.split(".");
      if (splitted.length > 2) {
        // java class name
        return splitted[splitted.length - 2] + ".html";
      }
    } else {
      for (const ext of [".R", ".py"]) {
        if (tool.endsWith(ext)) {
          return tool.slice(0, -1 * ext.length) + ".html";
        }
      }
    }
    return tool;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subs => subs.unsubscribe());
    this.subscriptions = [];
  }

  runJob() {
    this.jobService.runJob(this.toolSelection);
  }

  getJobList(): Job[] {
    return UtilsService.mapValues(this.sessionData.jobsMap);
  }

  updateJobs() {
    this.jobList = this.getJobList();
    this.runningJobs = this.jobList.reduce((runningCount, job) => {
      if (job.state === "RUNNING" || job.state === "NEW") {
        return runningCount + 1;
      } else {
        return runningCount;
      }
    }, 0);
  }

  updateBindings(updatedBindings: InputBinding[]) {
    const toolSelection: ToolSelection = {
      tool: this.toolSelection.tool,
      inputBindings: updatedBindings,
      category: this.toolSelection.category,
      module: this.toolSelection.module
    };

    this.toolSelection$.next(toolSelection);
  }
}
