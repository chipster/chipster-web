import { DOCUMENT } from "@angular/common";
import { Component, Inject, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { NgbDropdownConfig, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { Hotkey, HotkeysService } from "angular2-hotkeys";
import { Category, Dataset, Job, Module, SessionEvent, Tool } from "chipster-js-common";
import { cloneDeep } from "lodash-es";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, Subject, combineLatest, of } from "rxjs";
import { filter, map, mergeMap, startWith, takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SettingsService } from "../../../../shared/services/settings.service";
import {
  CLEAR_SELECTED_TOOL_BY_ID,
  CLEAR_SELECTED_TOOL_WITH_INPUTS,
  CLEAR_SELECTED_TOOL_WITH_POPULATED_PARAMS,
  CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
  CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
  CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
  CLEAR_VALIDATED_TOOL,
  SET_SELECTED_TOOL_WITH_INPUTS,
  SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
  SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
  SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
  SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
  SET_VALIDATED_TOOL,
} from "../../../../state/tool.reducer";
import { ManualModalComponent } from "../../../manual/manual-modal/manual-modal.component";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { DatasetModalService } from "../selectiondetails/datasetmodal.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";
import { ToolSelectionService } from "../tool.selection.service";
import {
  SelectedTool,
  SelectedToolById,
  SelectedToolWithInputs,
  SelectedToolWithValidatedInputs,
  SelectedToolWithValidatedParameters,
  SelectedToolWithValidatedResources,
  ValidatedTool,
  ValidationResult,
} from "./ToolSelection";
import { ParametersModalComponent } from "./parameters-modal/parameters-modal.component";
import { ToolService } from "./tool.service";

interface ToolSearchListItem {
  moduleName: string;
  moduleId: string;
  category: string;
  tool: Tool;
  toolName: string;
  toolId: string;
  description: string;
}

// Define the enum
enum ModuleSelectionMode {
  Tabs = "tabs",
  Dropdown = "dropdown",
}

@Component({
  selector: "ch-tools",
  templateUrl: "./tools.component.html",
  styleUrls: ["./tools.component.less"],
  providers: [NgbDropdownConfig],
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

  private toolsMap: Map<string, Tool>;

  public selectedTool: SelectedTool;
  public validatedTool: ValidatedTool;

  public toolSearchList: Array<ToolSearchListItem>;

  public runEnabled: boolean;
  public runIsDropdown: boolean;
  public defineHintVisible = false;
  public paramButtonWarning: boolean;
  public paramButtonChanged: boolean;
  public runningJobs = 0;
  public jobList: Job[];

  modules: Array<Module> = [];

  selectedModule: Module = null; // used in modal to keep track of which module has been selected
  selectedCategory: Category = null; // used in modal to keep track of which category has been selected

  public ModuleSelectionMode = ModuleSelectionMode; // for template references
  public moduleSelectionMode: ModuleSelectionMode = ModuleSelectionMode.Dropdown;
  public toolsetTitleVisible = true;

  compactToolList = true;

  public searchBoxModel: ToolSearchListItem;
  private searchBoxHotkey: Hotkey | Hotkey[];

  private lastJobStartedToastId: number;

  // use to signal that parameters have been changed and need to be validated
  private parametersChanged$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private resourcesChanged$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private unsubscribe: Subject<any> = new Subject();
  manualModalRef: any;

  parametersModalRef: NgbModalRef;

  constructor(
    @Inject(DOCUMENT) private document: any,
    public settingsService: SettingsService,
    private toolSelectionService: ToolSelectionService,
    public selectionService: SelectionService,
    private jobService: JobService,
    private selectionHandlerService: SelectionHandlerService,
    private sessionEventService: SessionEventService,
    private sessionDataService: SessionDataService,
    public toolService: ToolService,
    private modalService: NgbModal,
    private hotkeysService: HotkeysService,
    private toastrService: ToastrService,
    private errorService: ErrorService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private store: Store<any>,
    dropdownConfig: NgbDropdownConfig,
    private ngbModal: NgbModal,
  ) {
    // prevent dropdowns from closing on click inside the dropdown
    // eslint-disable-next-line no-param-reassign
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit() {
    // TODO why the copies?
    // this.tools = cloneDeep(this.toolsArray);
    this.modules = cloneDeep(this.modulesArray);

    this.toolSearchList = this.createToolSearchList();

    this.subscribeToToolEvents();

    this.updateJobs();

    this.subscribeToJobEvents();

    this.addHotKeys();

    if (this.modules[0] != null) {
      this.selectModuleAndFirstCategoryAndFirstTool(this.modules[0]);
    } else {
      this.errorService.showError("Cannot select module: " + this.modules, null);
    }

    this.toolsMap = new Map(this.toolsArray.map((entry: any) => [entry.key, entry.value]));
  }

  ngOnDestroy() {
    this.clearStoreToolSelections();
    this.parametersChanged$ = null;
    this.resourcesChanged$ = null;
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
    this.hotkeysService.remove(this.searchBoxHotkey);

    if (this.manualModalRef != null) {
      this.manualModalRef.close();
    }
  }

  dropDownSelectModule(module: Module) {
    this.selectModuleAndFirstCategoryAndFirstTool(module);
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

    if (category.tools.length > 0) {
      this.selectTool(category.tools[0]);
    }
  }

  selectTool(tool: Tool) {
    this.toolSelectionService.selectTool(this.selectedModule, this.selectedCategory, tool);
  }

  setBindings(toolWithInputs: SelectedToolWithInputs) {
    this.store.dispatch({
      type: SET_SELECTED_TOOL_WITH_INPUTS,
      payload: toolWithInputs,
    });
  }

  onParametersChanged() {
    if (this.parametersChanged$ != null) {
      this.parametersChanged$.next(null);
    }
  }

  onResourcesChanged() {
    if (this.resourcesChanged$ != null) {
      this.resourcesChanged$.next(null);
    }
  }

  openChange(isOpen) {
    if (isOpen) {
      this.searchBox.focus();
    }
  }

  runJob(runForEach: boolean) {
    if (runForEach) {
      this.jobService.runForEach(this.validatedTool, this.sessionData);
      this.showRunJobToaster(this.validatedTool.selectedDatasets.length);
    } else {
      this.jobService.runJob(this.validatedTool);
      this.showRunJobToaster();
    }
  }

  runForEachSample() {
    this.jobService.runForEachSample(this.validatedTool, this.sessionData);

    this.showRunJobToaster(this.validatedTool.sampleGroups.pairedEndSamples.length);
  }

  private showRunJobToaster(jobCount = 1) {
    const notificationText = jobCount > 1 ? `${jobCount} jobs started` : "Job started";

    // close the previous toastr not to cover the run button
    // we can't use the global preventDuplicates because we wan't to show duplicates of error messages
    if (this.lastJobStartedToastId != null) {
      this.toastrService.remove(this.lastJobStartedToastId);
    }
    this.lastJobStartedToastId = this.toastrService.info(notificationText, "", {
      timeOut: 1500,
    }).toastId;
  }

  updateJobs() {
    this.jobList = this.sessionDataService.getJobList(this.sessionData);
    this.runningJobs = this.jobList.reduce((runningCount, job) => {
      if (JobService.isRunning(job)) {
        return runningCount + 1;
      }
      return runningCount;
    }, 0);
  }

  openManualModal() {
    this.manualModalRef = this.modalService.open(ManualModalComponent, {
      size: "lg",
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
            tool,
            toolName: tool.name.displayName,
            toolId: tool.name.id,
            description: tool.description,
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

    return termTokens.every(
      (termToken: string) =>
        item.toolName.toLowerCase().indexOf(termToken) !== -1 ||
        (item.description && item.description.toLowerCase().indexOf(termToken) !== -1) ||
        item.category.toLowerCase().indexOf(termToken) !== -1 ||
        item.moduleName.toLowerCase().indexOf(termToken) !== -1 ||
        item.toolId.toLowerCase().indexOf(termToken) !== -1,
    );
  }

  public openJobs() {
    // scroll to latest jobs at top, if some other job was selected before
    this.selectionHandlerService.setJobSelection([]);

    this.dialogModalService.openJobsModal(
      this.sessionDataService.getJobList(this.sessionData),
      this.toolsArray,
      this.sessionData,
    );
  }

  public searchBoxSelect(item) {
    // at least clicking clear text after selecting an item results as change(undefined)
    if (!item) {
      return;
    }

    this.toolSelectionService.selectToolById(item.moduleId, item.category, item.toolId);
  }

  public searchBoxBlur() {
    this.searchBoxModel = null;
  }

  private subscribeToToolEvents() {
    this.store
      .select("selectedToolById")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((t: SelectedToolById) => {
        if (t != null) {
          // get the tool from categroy based on the id
          // other parts of the UI may have their own instances of tools,
          // which don't have the saved parameter values
          const module = this.modulesMap.get(t.moduleId);

          if (module == null) {
            this.errorService.showSimpleError(
              "Module not found",
              "Module " + t.moduleId + " does not exist. Please try to find the tool from other modules.",
            );
            return;
          }
          const category = module.categoriesMap.get(t.categoryName);
          if (category == null) {
            this.errorService.showSimpleError(
              "Category not found",
              "Category " + t.categoryName + " does not exist. Please try to find the tool from other categories.",
            );
            return;
          }
          const tool = category.tools.filter((t1) => t1.name.id === t.toolId)[0];
          if (tool == null) {
            this.errorService.showSimpleError(
              "Tool not found",
              "Tool " + t.toolId + " does not exist. Please try to find an alternative tool.",
            );
            return;
          }

          this.selectModule(module);
          this.selectCategory(category);
          this.selectTool(tool);

          const toolElementId = this.toolElementIdPrefix + t.toolId;

          setTimeout(() => {
            this.searchBoxModel = null;
            this.document.getElementById(toolElementId).focus();
          });
        }
      });

    // subscribe to selected tool
    this.store
      .select("selectedTool")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((t: SelectedTool) => {
        this.selectedTool = t;
        this.runEnabled = false;
        this.paramButtonWarning = false;
        this.paramButtonChanged = false;
        this.runIsDropdown = false;
      });

    const selectedDatasetsContentsUpdated$ = this.sessionEventService
      .getSelectedDatasetsContentsUpdatedStream()
      .pipe(startWith(null as SessionEvent));

    combineLatest([
      this.store.select("selectedTool"),
      this.store.select("selectedDatasets"),
      selectedDatasetsContentsUpdated$, // triggers but data not
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedTool, selectedDatasets]) => {
        if (selectedTool) {
          const uptodateDatasets = selectedDatasets.map(
            (dataset): Dataset => this.sessionData.datasetsMap.get(dataset.datasetId),
          );

          this.store.dispatch({
            type: SET_SELECTED_TOOL_WITH_INPUTS,
            payload: {
              inputBindings: this.toolService.bindInputs(this.sessionData, selectedTool.tool, uptodateDatasets),
              selectedDatasets,
              ...selectedTool,
            },
          });
        } else {
          this.clearStoreToolSelections();
        }
      });

    // validate inputs
    this.store
      .select("selectedToolWithInputs")
      .pipe(
        takeUntil(this.unsubscribe),
        filter((value) => value !== null),
        map((toolWithInputs: SelectedToolWithInputs) => {
          const inputsValidation: ValidationResult = this.toolSelectionService.validateInputs(toolWithInputs);
          const inputsValid = inputsValidation.valid;
          const inputsMessage = inputsValidation.message;

          // don't try to bind and validate phenodata unless inputs are valid
          // NOTE: input could be valid if they are all optional, and no data selected
          // now bindPhenodata results as empty binding -> phenodata will be invalid
          // which maybe is correct?
          const phenodataBindings = inputsValid
            ? this.toolService.bindPhenodata(toolWithInputs)
            : this.toolService.getUnboundPhenodataBindings(toolWithInputs);

          const phenodataValid = inputsValid ? this.toolSelectionService.validatePhenodata(phenodataBindings) : false;

          // phenodata validation message, here for now
          let phenodataMessage = "";
          if (!phenodataValid) {
            if (!inputsValid) {
              phenodataMessage = "Inputs need to be valid to determine phenodata";
            } else if (phenodataBindings.length > 1) {
              phenodataMessage = "Tool with multiple phenodata inputs not supported yet";
            } else {
              phenodataMessage = "No phenodata available";
            }
          }

          return {
            singleJobInputsValidation: {
              valid: inputsValid,
              message: inputsMessage,
            },
            phenodataValidation: {
              valid: phenodataValid,
              message: phenodataMessage,
            },
            phenodataBindings,
            ...toolWithInputs,
          };
        }),
      )
      .subscribe((toolWithValidatedInputs: SelectedToolWithValidatedInputs) => {
        this.store.dispatch({
          type: SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
          payload: toolWithValidatedInputs,
        });
      });

    // populate parameters after input bindings change (and have been validated)
    this.store
      .select("selectedToolWithValidatedInputs")
      .pipe(
        takeUntil(this.unsubscribe),
        filter((value) => value !== null),
        mergeMap((toolWithInputs: SelectedToolWithValidatedInputs) =>
          // populate params is async, and returns the same tool with params populated
          // if there are no params, just return the same tool as observable
          toolWithInputs.tool.parameters.length > 0
            ? this.toolSelectionService.populateParameters(toolWithInputs, this.sessionData)
            : of(toolWithInputs),
        ),
      )
      .subscribe((toolWithPopulatedParams: SelectedToolWithValidatedInputs) => {
        this.store.dispatch({
          type: SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
          payload: toolWithPopulatedParams,
        });
      });

    // validate parameters after parameters changed (or populated)
    // null is meaningful here
    // beware when changing session to avoid old data
    combineLatest([
      this.store.select("selectedToolWithPopulatedParams"),
      // .pipe(filter((value) => value !== null)),
      this.parametersChanged$, // signals when user changes parameters
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        map(([toolWithPopulatedParamsAndValidatedInputs]) => {
          if (toolWithPopulatedParamsAndValidatedInputs == null) {
            return null;
          }
          return this.toolSelectionService.validateParameters(toolWithPopulatedParamsAndValidatedInputs);
        }),
      )
      .subscribe((toolWithValidatedParams: SelectedToolWithValidatedParameters) => {
        // should we dispatch null here? now we do
        if (toolWithValidatedParams != null) {
          this.store.dispatch({
            type: SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
            payload: toolWithValidatedParams,
          });
        } else {
          this.store.dispatch({
            type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
          });
        }
      });

    // validate resources after resources changed
    // null is meaningful here
    // beware when changing session to avoid old data
    combineLatest([
      this.store.select("selectedToolWithValidatedParams"),
      // .pipe(filter((value) => value !== null)),
      this.resourcesChanged$, // signals when user changes parameters
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        map(([toolWithValidatedParams]) => {
          if (toolWithValidatedParams == null) {
            return null;
          }
          return this.toolSelectionService.validateResources(toolWithValidatedParams);
        }),
      )
      .subscribe((toolWithValidatedResources: SelectedToolWithValidatedResources) => {
        if (toolWithValidatedResources != null) {
          this.store.dispatch({
            type: SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
            payload: toolWithValidatedResources,
          });
        } else {
          this.store.dispatch({
            type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
          });
        }
      });

    // run for each validation and create validated tool
    this.store
      .select("selectedToolWithValidatedResources")
      .pipe(
        takeUntil(this.unsubscribe),
        // filter((value) => value !== null),
        map((toolWithValidatedResources: SelectedToolWithValidatedResources) => {
          if (toolWithValidatedResources == null) {
            return null;
          }
          return this.toolSelectionService.getValidatedTool(toolWithValidatedResources, this.sessionData);
        }),
      )
      .subscribe((validatedTool: ValidatedTool) => {
        if (validatedTool != null) {
          this.store.dispatch({
            type: SET_VALIDATED_TOOL,
            payload: validatedTool,
          });
        } else {
          this.store.dispatch({
            type: CLEAR_VALIDATED_TOOL,
          });
        }
      });

    // subscribe to validated tool
    this.store
      .select("validatedTool")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((tool: ValidatedTool) => {
        this.validatedTool = tool;

        // componentInstance is undefined for closed modal
        if (this.parametersModalRef?.componentInstance != null) {
          this.parametersModalRef.componentInstance.validatedTool = this.validatedTool;
        }

        this.runIsDropdown = tool && (tool.runForEachValidation.valid || tool.runForEachSampleValidation.valid);

        this.runEnabled =
          tool &&
          (tool.singleJobValidation.valid || tool.runForEachValidation.valid || tool.runForEachSampleValidation.valid);
        this.paramButtonWarning = !this.runEnabled;
        this.paramButtonChanged = this.toolSelectionService.parametersHaveBeenChanged(tool);
        this.defineHintVisible =
          tool != null &&
          this.validatedTool.sampleGroups.singleEndSamples.length < 1 &&
          this.validatedTool.sampleGroups.pairedEndSamples.length < 1 &&
          this.validatedTool.sampleGroups.pairMissingSamples.length < 1;
      });
  }

  private subscribeToJobEvents() {
    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.updateJobs();
        },
        (err) => this.errorService.showError("failed to update jobs", err),
      );
  }

  private addHotKeys() {
    // add search box hotkey
    this.searchBoxHotkey = this.hotkeysService.add(
      new Hotkey(
        "t",
        (): boolean => {
          this.searchBox.focus();
          return false;
        },
        undefined,
        "Find tool",
      ),
    );
  }

  onDefineSamples() {
    this.datasetModalService.openGroupsModal(this.selectionService.selectedDatasets, this.sessionData);
  }

  private clearStoreToolSelections() {
    // don't clear selectedTool to avoid looping
    // null should also go through the validation etc chain, but just to be sure

    this.store.dispatch({ type: CLEAR_SELECTED_TOOL_BY_ID });
    this.store.dispatch({ type: CLEAR_SELECTED_TOOL_WITH_INPUTS });
    this.store.dispatch({
      type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
    });
    this.store.dispatch({
      type: CLEAR_SELECTED_TOOL_WITH_POPULATED_PARAMS,
    });
    this.store.dispatch({
      type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
    });

    this.store.dispatch({
      type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
    });

    this.store.dispatch({
      type: CLEAR_VALIDATED_TOOL,
    });
  }

  openParametersModal() {
    this.parametersModalRef = this.ngbModal.open(ParametersModalComponent, {
      size: "lg",
    });
    this.parametersModalRef.componentInstance.validatedTool = this.validatedTool;
    this.parametersModalRef.componentInstance.sessionData = this.sessionData;
    this.parametersModalRef.componentInstance.parametersChanged.subscribe({
      next: () => this.onParametersChanged(),
    });
    this.parametersModalRef.componentInstance.updateBindings.subscribe({
      next: (toolWithInputs: SelectedToolWithInputs) => this.setBindings(toolWithInputs),
    });
    this.parametersModalRef.componentInstance.resourcesChanged.subscribe({
      next: () => this.onResourcesChanged(),
    });
  }
}
