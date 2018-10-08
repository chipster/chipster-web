import { NgbDropdownConfig, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SessionData } from "../../../../model/session/session-data";
import {
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  Component,
  Inject
} from "@angular/core";
import { ToolSelection } from "./ToolSelection";
import { Job, Module, Tool, Category, InputBinding } from "chipster-js-common";
import { Subject } from "rxjs/Subject";
import { SettingsService } from "../../../../shared/services/settings.service";
import { ToolSelectionService } from "../tool.selection.service";
import { SelectionService } from "../selection.service";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SessionEventService } from "../sessionevent.service";
import { ToolService } from "./tool.service";
import * as _ from "lodash";
import UtilsService from "../../../../shared/utilities/utils";
import { ManualModalComponent } from "../../../manual/manual-modal/manual-modal.component";
import { DOCUMENT } from "@angular/common";
import { HotkeysService, Hotkey } from "angular2-hotkeys";

interface ToolSearchListItem {
  moduleName: string;
  moduleId: string;
  category: string;
  tool: Tool;
  toolName: string;
  toolId: string;
  description: string;
}

@Component({
  selector: "ch-tools",
  templateUrl: "./tools.component.html",
  styleUrls: ["./tools.component.less"],
  providers: [NgbDropdownConfig]
})
export class ToolsComponent implements OnInit, OnDestroy {
  public readonly categoryElementIdPrefix = "category-button-";
  public readonly toolElementIdPrefix = "tool-button-";

  @Input()
  public sessionData: SessionData;

  @ViewChild("searchBox")
  searchBox;

  public toolSearchList: Array<ToolSearchListItem>;

  public toolSelection: ToolSelection;
  public runningJobs = 0;
  public jobList: Job[];

  modules: Array<Module> = [];
  tools: Array<Tool> = [];

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  compactToolList = true;

  private unsubscribe: Subject<any> = new Subject();

  public searchBoxModel: ToolSearchListItem;
  private searchBoxHotkey: Hotkey | Hotkey[];

  constructor(
    @Inject(DOCUMENT) private document: any,
    public settingsService: SettingsService,
    public toolSelectionService: ToolSelectionService,
    public selectionService: SelectionService,
    private jobService: JobService,
    private selectionHandlerService: SelectionHandlerService,
    private sessionEventService: SessionEventService,
    public toolService: ToolService,
    private modalService: NgbModal,
    private hotkeysService: HotkeysService,
    dropdownConfig: NgbDropdownConfig
  ) {
    // prevent dropdowns from closing on click inside the dropdown
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit() {
    this.tools = _.cloneDeep(this.sessionData.tools);
    this.modules = _.cloneDeep(this.sessionData.modules);
    this.toolSearchList = this.createToolSearchList();

    // subscribe to tool selection
    this.toolSelectionService.toolSelection$
      .takeUntil(this.unsubscribe)
      .subscribe((toolSelection: ToolSelection) => {
        this.toolSelection = toolSelection;
      });

    // subscribe to file selection
    this.selectionService.selectedDatasets$
      .takeUntil(this.unsubscribe)
      .subscribe(() => {
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
      this.selectModuleAndFirstCategoryAndFirstTool(this.modules[0]);
    }

    this.updateJobs();

    // subscribe to job events
    this.sessionEventService
      .getJobStream()
      .takeUntil(this.unsubscribe)
      .subscribe(() => {
        this.updateJobs();
      });

    // add search box hotkey
    this.searchBoxHotkey = this.hotkeysService.add(
      new Hotkey(
        "t",
        (): boolean => {
          this.searchBox.focus();
          return false;
        },
        undefined,
        "Find tool"
      )
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.hotkeysService.remove(this.searchBoxHotkey);
  }

  selectModule(module: Module) {
    this.selectedModule = module;
  }

  selectModuleAndFirstCategoryAndFirstTool(module: Module) {
    this.selectedModule = module;
    if (module.categories.length > 0) {
      this.selectCategoryAndFirstTool(module.categories[0]);
    }
  }

  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  selectCategoryAndFirstTool(category: Category) {
    this.selectedCategory = category;
    const categoryElementId = this.categoryElementIdPrefix + category.name;
    setTimeout(() => {
      this.scrollIntoViewByElementId(categoryElementId);
    });

    if (category.tools.length > 0) {
      this.selectTool(category.tools[0]);
      const toolElementId =
        this.toolElementIdPrefix + category.tools[0].name.id;
      setTimeout(() => {
        this.scrollIntoViewByElementId(toolElementId);
      });
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

  private createToolSearchList(): ToolSearchListItem[] {
    const list: ToolSearchListItem[] = [];
    this.modules.forEach((module: Module) => {
      module.categories.forEach((category: Category) => {
        category.tools.forEach((tool: Tool) => {
          // TODO ignore hidden
          list.push({
            moduleId: module.moduleId,
            moduleName: module.name,
            category: category.name,
            tool: tool,
            toolName: tool.name.displayName,
            toolId: tool.name.id,
            description: tool.description
          });
        });
      });
    });

    return list;
  }

  public filterTool(term: string, item: any): boolean {
    const termTokens = term
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((s: string) => s.length > 0);

    return termTokens.every((termToken: string) => {
      return (
        item.toolName.toLowerCase().indexOf(termToken) !== -1 ||
        (item.description &&
          item.description.toLowerCase().indexOf(termToken) !== -1) ||
        item.category.toLowerCase().indexOf(termToken) !== -1 ||
        item.moduleName.toLowerCase().indexOf(termToken) !== -1
      );
    });
  }

  public searchBoxSelect(item) {
    // at least clicking clear text after selecting an item results as change(undefined)
    if (!item) {
      return;
    }

    const module = this.sessionData.modulesMap.get(item.moduleId);
    this.selectModule(module);
    this.selectCategory(module.categoriesMap.get(item.category));
    this.selectTool(item.tool);
    const categoryElementId = this.categoryElementIdPrefix + item.category;
    const toolElementId = this.toolElementIdPrefix + item.toolId;

    setTimeout(() => {
      this.searchBoxModel = null;

      this.scrollIntoViewByElementId(categoryElementId);
      this.scrollIntoViewByElementId(toolElementId);

      this.document.getElementById(toolElementId).focus();
    });
  }

  public searchBoxBlur(event) {
    this.searchBoxModel = null;
  }

  private scrollIntoViewByElementId(elementId: string) {
    this.document
      .getElementById(elementId)
      .scrollIntoView({ behavior: "smooth" });
  }
}
