import { DOCUMENT } from "@angular/common";
import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import {
  NgbDropdownConfig,
  NgbModal,
  NgbModalRef
} from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { Hotkey, HotkeysService } from "angular2-hotkeys";
import {
  Category,
  Job,
  JobState,
  Module,
  Tool,
  WorkflowJobPlan,
  WorkflowPlan,
  WorkflowRun
} from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, combineLatest, of, Subject } from "rxjs";
import { filter, map, mergeMap, takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SettingsService } from "../../../../shared/services/settings.service";
import UtilsService from "../../../../shared/utilities/utils";
import {
  CLEAR_SELECTED_TOOL_WITH_INPUTS,
  CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
  CLEAR_VALIDATED_TOOL,
  SET_SELECTED_TOOL,
  SET_SELECTED_TOOL_WITH_INPUTS,
  SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
  SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
  SET_VALIDATED_TOOL
} from "../../../../state/tool.reducer";
import { ManualModalComponent } from "../../../manual/manual-modal/manual-modal.component";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";
import { ToolSelectionService } from "../tool.selection.service";
import { ToolService } from "./tool.service";
import {
  ParameterValidationResult,
  SelectedTool,
  SelectedToolWithInputs,
  SelectedToolWithValidatedInputs,
  ValidatedTool
} from "./ToolSelection";

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

  @Input()
  private toolsArray: Tool[]; // stupid name, but tools used for internal copy

  @Input()
  private modulesArray: Module[]; // stupid name, but modules used for internal copy

  @Input()
  private modulesMap: Map<string, Module>;

  @ViewChild("searchBox")
  searchBox;

  public selectedTool: SelectedTool;
  public validatedTool: ValidatedTool;

  public toolSearchList: Array<ToolSearchListItem>;

  public runEnabled: boolean;
  public runForEachEnabled: boolean;
  public runningJobs = 0;
  public jobList: Job[];

  modules: Array<Module> = [];
  tools: Array<Tool> = [];

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  compactToolList = true;

  public searchBoxModel: ToolSearchListItem;
  private searchBoxHotkey: Hotkey | Hotkey[];

  private lastJobStartedToastId: number;

  // use to signal that parameters have been changed and need to be validated
  private parametersChanged$: BehaviorSubject<null> = new BehaviorSubject<null>(
    null
  );

  isWorkflowTabVisible = false;
  selectedDatasets = [];
  workflowPlans: Array<WorkflowPlan>;
  workflowRuns: Array<WorkflowRun>;
  selectedWorkflowPlan: WorkflowPlan;

  private unsubscribe: Subject<null> = new Subject();
  manualModalRef: NgbModalRef;
  selectedWorkflowRun: WorkflowRun;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public settingsService: SettingsService,
    private toolSelectionService: ToolSelectionService,
    public selectionService: SelectionService,
    private jobService: JobService,
    private selectionHandlerService: SelectionHandlerService,
    private sessionEventService: SessionEventService,
    public toolService: ToolService,
    private modalService: NgbModal,
    private hotkeysService: HotkeysService,
    private toastrService: ToastrService,
    private errorService: ErrorService,
    private store: Store<{}>,
    private dialogModalService: DialogModalService,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    dropdownConfig: NgbDropdownConfig
  ) {
    // prevent dropdowns from closing on click inside the dropdown
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit(): void {
    // TODO why the copies?
    this.tools = _.cloneDeep(this.toolsArray);
    this.modules = _.cloneDeep(this.modulesArray);
    this.toolSearchList = this.createToolSearchList();

    this.subscribeToToolEvents();

    this.updateJobs();

    this.subscribeToJobEvents();

    this.addHotKeys();

    this.selectModuleAndFirstCategoryAndFirstTool(this.modules[0]);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.hotkeysService.remove(this.searchBoxHotkey);

    if (this.manualModalRef != null) {
      this.manualModalRef.close();
    }
  }

  selectModule(module: Module): void {
    this.selectedModule = module;
  }

  selectModuleAndFirstCategoryAndFirstTool(module: Module): void {
    this.showWorkflowTab(false);
    this.selectedModule = module;
    if (module.categories.length > 0) {
      this.selectCategoryAndFirstTool(module.categories[0]);
    }
  }

  selectCategory(category: Category): void {
    this.selectedCategory = category;
  }

  selectCategoryAndFirstTool(category: Category): void {
    this.selectedCategory = category;

    if (category.tools.length > 0) {
      this.selectTool(category.tools[0]);
    }
  }

  selectTool(tool: Tool): void {
    const selectedTool: SelectedTool = {
      tool: tool,
      category: this.selectedCategory,
      module: this.selectedModule
    };
    this.store.dispatch({ type: SET_SELECTED_TOOL, payload: selectedTool });
  }

  setBindings(toolWithInputs: SelectedToolWithInputs): void {
    this.store.dispatch({
      type: SET_SELECTED_TOOL_WITH_INPUTS,
      payload: toolWithInputs
    });
  }

  onParametersChanged(): void {
    this.parametersChanged$.next(null);
  }

  openChange(isOpen): void {
    if (isOpen) {
      this.searchBox.focus();
    }
  }

  runJob(runForEach: boolean): void {
    let notificationText;
    if (runForEach) {
      this.jobService.runForEach(this.validatedTool);
      notificationText =
        this.validatedTool.selectedDatasets.length + " jobs started";
    } else {
      this.jobService.runJob(this.validatedTool);
      notificationText = "Job started";
    }

    // close the previous toastr not to cover the run button
    // we can't use the global preventDuplicates because we wan't to show duplicates of error messages
    if (this.lastJobStartedToastId != null) {
      this.toastrService.remove(this.lastJobStartedToastId);
    }
    this.lastJobStartedToastId = this.toastrService.info(notificationText, "", {
      timeOut: 1500
    }).toastId;
  }

  getJobList(): Job[] {
    return UtilsService.mapValues(this.sessionData.jobsMap);
  }

  updateJobs(): void {
    this.jobList = this.getJobList();
    this.runningJobs = this.jobList.reduce((runningCount, job) => {
      if (job.state === "RUNNING" || job.state === "NEW") {
        return runningCount + 1;
      } else {
        return runningCount;
      }
    }, 0);
  }

  onJobSelection(job: Job): void {
    this.selectionHandlerService.setJobSelection([job]);
  }

  openManualModal(): void {
    this.manualModalRef = this.modalService.open(ManualModalComponent, {
      size: "lg"
    });
    this.manualModalRef.componentInstance.tool = this.selectedTool.tool;
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

  public filterTool(term: string, item: ToolSearchListItem): boolean {
    const termTokens = term
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((s: string) => s.length > 0);

    return termTokens.every((termToken: string) => {
      return (
        !item.toolName.toLowerCase().includes(termToken) ||
        (item.description &&
          !item.description.toLowerCase().includes(termToken)) ||
        !item.category.toLowerCase().includes(termToken) ||
        !item.moduleName.toLowerCase().includes(termToken) ||
        !item.toolId.toLowerCase().includes(termToken)
      );
    });
  }

  public searchBoxSelect(item): void {
    // at least clicking clear text after selecting an item results as change(undefined)
    if (!item) {
      return;
    }

    const module = this.modulesMap.get(item.moduleId);
    this.selectModule(module);
    this.selectCategory(module.categoriesMap.get(item.category));
    this.selectTool(item.tool);
    const toolElementId = this.toolElementIdPrefix + item.toolId;

    setTimeout(() => {
      this.searchBoxModel = null;
      this.document.getElementById(toolElementId).focus();
    });
  }

  public searchBoxBlur(): void {
    this.searchBoxModel = null;
  }

  private subscribeToToolEvents(): void {
    // subscribe to selected tool
    this.store
      .select("selectedTool")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((t: SelectedTool) => {
        this.selectedTool = t;
        this.runEnabled = false;
        this.runForEachEnabled = false;
      });

    // bind inputs after tool selection or dataset selection changes
    combineLatest(
      this.store.select("selectedTool"),
      this.store.select("selectedDatasets")
    )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedTool, selectedDatasets]) => {
        if (selectedTool) {
          this.store.dispatch({
            type: SET_SELECTED_TOOL_WITH_INPUTS,
            payload: Object.assign(
              {
                inputBindings: this.toolService.bindInputs(
                  this.sessionData,
                  selectedTool.tool,
                  selectedDatasets
                ),
                selectedDatasets: selectedDatasets
              },
              selectedTool
            )
          });
        } else {
          this.store.dispatch({ type: CLEAR_SELECTED_TOOL_WITH_INPUTS });
          this.store.dispatch({
            type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS
          });
          this.store.dispatch({
            type: CLEAR_VALIDATED_TOOL
          });
        }
      });

    // validate inputs
    this.store
      .select("selectedToolWithInputs")
      .pipe(
        filter(value => value !== null),
        map((toolWithInputs: SelectedToolWithInputs) => {
          const inputsValid = this.toolSelectionService.validateInputs(
            toolWithInputs
          );
          const runForEachValid = this.toolSelectionService.validateRunForEach(
            toolWithInputs,
            this.sessionData
          );

          // don't try to bind and validate phenodata unless inputs are valid
          const phenodataBindings = inputsValid
            ? this.toolService.bindPhenodata(toolWithInputs)
            : this.toolService.getUnboundPhenodataBindings(toolWithInputs);

          const phenodataValid = inputsValid
            ? this.toolSelectionService.validatePhenodata(phenodataBindings)
            : false;

          // phenodata validation message, here for now
          let phenodataMessage = "";
          if (!phenodataValid) {
            if (!inputsValid) {
              phenodataMessage =
                "Inputs need to be valid to determine phenodata";
            } else if (phenodataBindings.length > 1) {
              phenodataMessage =
                "Tool with multiple phenodata inputs not supported yet";
            } else {
              phenodataMessage =
                "No phenodata available for " +
                toolWithInputs.inputBindings[0].datasets[0].name;
            }
          }

          return Object.assign(
            {
              inputsValid: inputsValid,
              runForEachValid: runForEachValid,
              phenodataValid: phenodataValid,
              phenodataMessage: phenodataMessage,
              phenodataBindings: phenodataBindings
            },
            toolWithInputs
          );
        })
      )
      .subscribe((toolWithValidatedInputs: SelectedToolWithValidatedInputs) => {
        this.store.dispatch({
          type: SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
          payload: toolWithValidatedInputs
        });
      });

    // populate parameters after input bindings change (and have been validated)
    this.store
      .select("selectedToolWithValidatedInputs")
      .pipe(
        filter(value => value !== null),
        mergeMap((toolWithInputs: SelectedToolWithValidatedInputs) => {
          // populate params is async, and returns the same tool with params populated
          // if there are no params, just return the same tool as observable
          return toolWithInputs.tool.parameters.length > 0
            ? this.toolSelectionService.populateParameters(toolWithInputs)
            : of(toolWithInputs);
        })
      )
      .subscribe((toolWithPopulatedParams: SelectedToolWithValidatedInputs) => {
        this.store.dispatch({
          type: SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
          payload: toolWithPopulatedParams
        });
      });

    // validate parameters after parameters changed (or populated)
    combineLatest(
      this.store
        .select("selectedToolWithPopulatedParams")
        .pipe(filter(value => value !== null)),
      this.parametersChanged$ // signals when user changes parameters
    )
      .pipe(
        map(([toolWithParamsAndValidatedInputs]) => {
          const parameterValidations: Map<
            string,
            ParameterValidationResult
          > = this.toolSelectionService.validateParameters(
            toolWithParamsAndValidatedInputs
          );
          const parametersValid = Array.from(
            parameterValidations.values()
          ).every((result: ParameterValidationResult) => result.valid);
          const validationMessage = this.toolSelectionService.getValidationMessage(
            parametersValid,
            toolWithParamsAndValidatedInputs.inputsValid,
            toolWithParamsAndValidatedInputs.phenodataValid
          );

          return Object.assign(
            {
              valid:
                toolWithParamsAndValidatedInputs.inputsValid &&
                toolWithParamsAndValidatedInputs.phenodataValid &&
                parametersValid,
              parametersValid: parametersValid,
              message: validationMessage,
              parameterResults: parameterValidations
            },
            toolWithParamsAndValidatedInputs
          );
        })
      )
      .subscribe((validatedTool: ValidatedTool) => {
        this.store.dispatch({
          type: SET_VALIDATED_TOOL,
          payload: validatedTool
        });
      });

    // subscribe to validated tool
    this.store.select("validatedTool").subscribe((tool: ValidatedTool) => {
      log.debug("validated tool ready", tool);
      this.validatedTool = tool;
      this.runEnabled = tool && tool.valid;
      this.runForEachEnabled = tool && tool.runForEachValid;
    });
  }

  private subscribeToJobEvents(): void {
    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.updateJobs();
        },
        err => this.errorService.showError("failed to update jobs", err)
      );
  }

  private addHotKeys(): void {
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

  showWorkflowTab(show: boolean): void {
    this.isWorkflowTabVisible = show;

    this.workflowPlans = Array.from(this.sessionData.workflowPlansMap.values());
    this.workflowRuns = Array.from(this.sessionData.workflowRunsMap.values());

    this.store
      .select("selectedDatasets")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        datasets => {
          this.selectedDatasets = datasets;
        },
        err => {
          this.errorService.showError("workflow error", err);
        }
      );

    this.sessionEventService.getWorkflowPlanStream().subscribe(
      () => {
        this.workflowPlans = Array.from(
          this.sessionData.workflowPlansMap.values()
        );
      },
      err => this.errorService.showError("workflow plan event error", err)
    );

    this.sessionEventService.getWorkflowRunStream().subscribe(
      () => {
        this.workflowRuns = Array.from(
          this.sessionData.workflowRunsMap.values()
        );
      },
      err => this.errorService.showError("workflow run event error", err)
    );
  }

  selectWorkflowPlan(plan: WorkflowPlan): void {
    this.selectedWorkflowPlan = plan;
  }

  selectWorkflowRun(run: WorkflowRun): void {
    this.selectedWorkflowRun = run;
  }

  runWorkflowPlan(): void {
    const run = new WorkflowRun();
    run.state = JobState.New;
    run.workflowPlanId = this.selectedWorkflowPlan.workflowPlanId;
    this.sessionDataService
      .createWorkflowRun(run)
      .subscribe(null, err =>
        this.restErrorService.showError("run workflow error", err)
      );
  }

  deleteWorkflowPlan(plan: WorkflowPlan): void {
    this.sessionDataService
      .deleteWorkflowPlan(plan)
      .subscribe(null, err =>
        this.restErrorService.showError("delete workflow plan error", err)
      );
  }

  deleteWorkflowRun(run: WorkflowRun): void {
    this.sessionDataService
      .deleteWorkflowRun(run)
      .subscribe(null, err =>
        this.restErrorService.showError("delete workflow run error", err)
      );
  }

  saveWorkflow(): void {
    this.dialogModalService
      .openStringModal(
        "Save workflow",
        "Save workflow from the selected datasets",
        "New workflow",
        "Save"
      )
      .pipe(
        mergeMap(name => {
          const plan = new WorkflowPlan();
          plan.name = name;
          plan.workflowJobPlans = [];
          this.selectedDatasets.forEach(d => {
            const sourceJob = this.sessionData.jobsMap.get(d.sourceJob);
            const job = new WorkflowJobPlan();
            job.toolId = sourceJob.toolId;
            job.toolCategory = sourceJob.toolCategory;
            job.module = sourceJob.module;
            job.toolName = sourceJob.toolName;
            // job.parameters = Object.assign({}, sourceJob.parameters);
            // job.inputs = Object.assign({}, sourceJob.inputs);
            // job.metadataFiles = Object.assign({}, sourceJob.metadataFiles);
            plan.workflowJobPlans.push(job);
          });
          return this.sessionDataService.createWorkflowPlan(plan);
        })
      )
      .subscribe(null, err =>
        this.errorService.showError("workflow save error", err)
      );
  }
}
