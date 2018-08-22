import { NgbDropdownConfig, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SessionData } from "../../../../model/session/session-data";
import { OnInit, OnDestroy, Input, ViewChild, Component } from "@angular/core";
import { SearchBoxComponent } from "../../../../shared/components/search-box/search-box.component";
import { ToolSelection } from "./ToolSelection";
import { Job, Module, Tool, Category, Dataset, InputBinding } from "chipster-js-common";
import { Subject } from "rxjs/Subject";
import { PipeService } from "../../../../shared/services/pipeservice.service";
import { SettingsService } from "../../../../shared/services/settings.service";
import { ToolSelectionService } from "../tool.selection.service";
import { SelectionService } from "../selection.service";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SessionEventService } from "../sessionevent.service";
import { ConfigService } from "../../../../shared/services/config.service";
import { ToolService } from "./tool.service";
import * as _ from "lodash";
import { ModulePipe } from "../../../../shared/pipes/modulepipe.pipe";
import { CategoryPipe } from "../../../../shared/pipes/categorypipe.pipe";
import { ToolPipe } from "../../../../shared/pipes/toolpipe.pipe";
import UtilsService from "../../../../shared/utilities/utils";
import { ManualModalComponent } from "../../../manual/manual-modal/manual-modal.component";

@Component({
  selector: "ch-tools",
  templateUrl: "./tools.component.html",
  styleUrls: ["./tools.component.less"],
  providers: [NgbDropdownConfig]
})
export class ToolsComponent implements OnInit, OnDestroy {
  @Input() public sessionData: SessionData;

  @ViewChild("searchBox") private searchBox: SearchBoxComponent;

  public toolSelection: ToolSelection;
  public runningJobs = 0;
  public jobList: Job[];

  modules: Array<Module> = [];
  tools: Array<Tool> = [];

  searchTool: string;

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  compactToolList = true;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private pipeService: PipeService,
    public settingsService: SettingsService,
    public toolSelectionService: ToolSelectionService,
    public selectionService: SelectionService,
    private jobService: JobService,
    private selectionHandlerService: SelectionHandlerService,
    private sessionEventService: SessionEventService,
    private configService: ConfigService,
    public toolService: ToolService,
    private modalService: NgbModal,
    dropdownConfig: NgbDropdownConfig
  ) {
    // prevent dropdowns from closing on click inside the dropdown
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit() {
    this.tools = _.cloneDeep(this.sessionData.tools);
    this.modules = _.cloneDeep(this.sessionData.modules);

    // subscribe to tool selection
    this.toolSelectionService.toolSelection$
      .takeUntil(this.unsubscribe)
      .subscribe((toolSelection: ToolSelection) => {
        this.toolSelection = toolSelection;
      });

    // subscribe to file selection
    this.selectionService.selectedDatasets$
      .takeUntil(this.unsubscribe)
      .subscribe((selectedDatasets: Array<Dataset>) => {
        if (this.toolSelection) {
          const updatedInputBindings = this.toolService.bindInputs(
            this.sessionData,
            this.toolSelection.tool,
            this.selectionService.selectedDatasets
          );
          const newToolSelection = Object.assign({}, this.toolSelection, {
            inputBindings: updatedInputBindings
          });
          this.toolSelectionService.selectTool(newToolSelection);
        }
      });

    // trigger parameter validation
    if (this.toolSelection) {
      // make sure the module and category are selected even after changing the session
      this.selectModule(this.toolSelection.module);
      this.selectCategory(this.toolSelection.category);
      this.selectTool(this.toolSelection.tool); // TODO is this really needed?
    } else {
      this.selectModule(this.modules[0]);
      this.selectCategory(this.selectedModule.categories[0]);
    }

    this.updateJobs();

    // subscribe to job events
    this.sessionEventService
      .getJobStream()
      .takeUntil(this.unsubscribe)
      .subscribe(() => {
        this.updateJobs();
      });
  }

  selectModule(module: Module) {
    this.selectedModule = module;
    this.selectFirstVisible();
  }

  // defines which tool category the user have selected
  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  selectFirstVisible() {
    const filteredModules = new ModulePipe(this.pipeService).transform(
      this.modules,
      this.searchTool
    );
    if (
      filteredModules &&
      filteredModules.indexOf(this.selectedModule) < 0 &&
      filteredModules[0]
    ) {
      this.selectModule(filteredModules[0]);
    }

    const filteredCategories = new CategoryPipe(this.pipeService).transform(
      this.selectedModule.categories,
      this.searchTool
    );
    if (
      filteredCategories &&
      filteredCategories.indexOf(this.selectedCategory) < 0 &&
      filteredCategories[0]
    ) {
      this.selectCategory(filteredCategories[0]);
    }
  }

  selectTool(tool: Tool) {
    const toolSelection: ToolSelection = {
      tool: tool,
      inputBindings: null,
      category: this.selectedCategory,
      module: this.selectedModule
    };

    this.toolSelectionService.selectToolAndBindInputs(
      toolSelection,
      this.sessionData
    );
  }

  search(value: any) {
    this.searchTool = value;
    this.selectFirstVisible();
  }

  searchEnter() {
    // select the first result
    const visibleTools = new ToolPipe(this.pipeService).transform(
      this.selectedCategory.tools,
      this.searchTool
    );
    if (visibleTools[0]) {
      this.searchTool = null;
      // this.selectTool(visibleTools[0].name.id);
      this.selectTool(visibleTools[0]);
    }
  }

  openChange(isOpen) {
    if (isOpen) {
      this.searchBox.focus();
    }
  }

  runJob() {
    this.jobService.runJob(this.toolSelection);
  }

  setBindings(updatedBindings: InputBinding[]) {
    const toolSelection: ToolSelection = {
      tool: this.toolSelection.tool,
      inputBindings: updatedBindings,
      category: this.toolSelection.category,
      module: this.toolSelection.module
    };

    this.toolSelectionService.selectTool(toolSelection);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
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

  onJobSelection(job: Job) {
    this.selectionHandlerService.setJobSelection([job]);
  }

  openManualModal() {
    const modalRef = this.modalService.open(ManualModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.tool = this.toolSelection.tool;
  }
}
