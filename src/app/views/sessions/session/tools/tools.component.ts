import { DOCUMENT } from "@angular/common";
import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { NgbDropdownConfig, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { Hotkey, HotkeysService } from "angular2-hotkeys";
import {
  Category,
  Dataset,
  EventType,
  Job,
  Module,
  Resource,
  SessionEvent,
  Tool,
} from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, combineLatest, of, Subject } from "rxjs";
import { filter, map, mergeMap, startWith, takeUntil } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
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
  SET_VALIDATED_TOOL,
} from "../../../../state/tool.reducer";
import { ManualModalComponent } from "../../../manual/manual-modal/manual-modal.component";
import { JobService } from "../job.service";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import { SessionEventService } from "../session-event.service";
import { ToolSelectionService } from "../tool.selection.service";
import { ToolService } from "./tool.service";
import {
  ParameterValidationResult,
  SelectedTool,
  SelectedToolWithInputs,
  SelectedToolWithValidatedInputs,
  ValidatedTool,
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
  private parametersChanged$: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  private unsubscribe: Subject<any> = new Subject();
  manualModalRef: any;

  constructor(
    @Inject(DOCUMENT) private document: any,
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
    private store: Store<any>,
    dropdownConfig: NgbDropdownConfig
  ) {
    // prevent dropdowns from closing on click inside the dropdown
    dropdownConfig.autoClose = "outside";
  }

  ngOnInit() {
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.hotkeysService.remove(this.searchBoxHotkey);

    if (this.manualModalRef != null) {
      this.manualModalRef.close();
    }
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
    const selectedTool: SelectedTool = {
      tool: tool,
      category: this.selectedCategory,
      module: this.selectedModule,
    };
    this.store.dispatch({ type: SET_SELECTED_TOOL, payload: selectedTool });
  }

  setBindings(toolWithInputs: SelectedToolWithInputs) {
    this.store.dispatch({
      type: SET_SELECTED_TOOL_WITH_INPUTS,
      payload: toolWithInputs,
    });
  }

  onParametersChanged() {
    this.parametersChanged$.next(null);
  }

  openChange(isOpen) {
    if (isOpen) {
      this.searchBox.focus();
    }
  }

  runJob(runForEach: boolean) {
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
      timeOut: 1500,
    }).toastId;
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
            tool: tool,
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

    return termTokens.every((termToken: string) => {
      return (
        item.toolName.toLowerCase().indexOf(termToken) !== -1 ||
        (item.description &&
          item.description.toLowerCase().indexOf(termToken) !== -1) ||
        item.category.toLowerCase().indexOf(termToken) !== -1 ||
        item.moduleName.toLowerCase().indexOf(termToken) !== -1 ||
        item.toolId.toLowerCase().indexOf(termToken) !== -1
      );
    });
  }

  public searchBoxSelect(item) {
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

  public searchBoxBlur() {
    this.searchBoxModel = null;
  }

  private subscribeToToolEvents() {
    // subscribe to selected tool
    this.store
      .select("selectedTool")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((t: SelectedTool) => {
        this.selectedTool = t;
        this.runEnabled = false;
        this.runForEachEnabled = false;
      });

    const selectedDatasetsContentsUpdated$ = this.sessionEventService
      .getDatasetStream()
      .pipe(
        filter(
          (sessionEvent) =>
            sessionEvent != null &&
            sessionEvent.event.type === EventType.Update &&
            sessionEvent.event.resourceType === Resource.Dataset &&
            this.selectionService.selectedDatasets.some(
              (selectedDataset) =>
                selectedDataset.datasetId ===
                (sessionEvent.newValue as Dataset).datasetId
            )
        ),
        map((sessionEvent) => (sessionEvent.newValue as Dataset).datasetId),
        startWith(null as SessionEvent)
      );

    combineLatest([
      this.store.select("selectedTool"),
      this.store.select("selectedDatasets"),
      selectedDatasetsContentsUpdated$, // triggers but data not
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedTool, selectedDatasets]) => {
        if (selectedTool) {
          const uptodateDatasets = selectedDatasets.map(
            (dataset): Dataset =>
              this.sessionData.datasetsMap.get(dataset.datasetId)
          );

          this.store.dispatch({
            type: SET_SELECTED_TOOL_WITH_INPUTS,
            payload: Object.assign(
              {
                inputBindings: this.toolService.bindInputs(
                  this.sessionData,
                  selectedTool.tool,
                  uptodateDatasets
                ),
                selectedDatasets: selectedDatasets,
              },
              selectedTool
            ),
          });
        } else {
          this.store.dispatch({ type: CLEAR_SELECTED_TOOL_WITH_INPUTS });
          this.store.dispatch({
            type: CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
          });
          this.store.dispatch({
            type: CLEAR_VALIDATED_TOOL,
          });
        }
      });

    // validate inputs
    this.store
      .select("selectedToolWithInputs")
      .pipe(
        filter((value) => value !== null),
        map((toolWithInputs: SelectedToolWithInputs) => {
          const inputsValid = this.toolSelectionService.validateInputs(
            toolWithInputs
          );
          const runForEachValid = this.toolSelectionService.validateRunForEach(
            toolWithInputs,
            this.sessionData
          );

          // don't try to bind and validate phenodata unless inputs are valid
          // NOTE: input could be valid if they are all optional, and no data selected
          // now bindPhenodata results as empty binding -> phenodata will be invalid
          // which maybe is correct?
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
              phenodataMessage = "No phenodata available";
            }
          }

          return Object.assign(
            {
              inputsValid: inputsValid,
              runForEachValid: runForEachValid,
              phenodataValid: phenodataValid,
              phenodataMessage: phenodataMessage,
              phenodataBindings: phenodataBindings,
            },
            toolWithInputs
          );
        })
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
        filter((value) => value !== null),
        mergeMap((toolWithInputs: SelectedToolWithValidatedInputs) => {
          // populate params is async, and returns the same tool with params populated
          // if there are no params, just return the same tool as observable
          return toolWithInputs.tool.parameters.length > 0
            ? this.toolSelectionService.populateParameters(
                toolWithInputs,
                this.sessionData
              )
            : of(toolWithInputs);
        })
      )
      .subscribe((toolWithPopulatedParams: SelectedToolWithValidatedInputs) => {
        this.store.dispatch({
          type: SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
          payload: toolWithPopulatedParams,
        });
      });

    // validate parameters after parameters changed (or populated)
    combineLatest(
      this.store
        .select("selectedToolWithPopulatedParams")
        .pipe(filter((value) => value !== null)),
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
              parameterResults: parameterValidations,
            },
            toolWithParamsAndValidatedInputs
          );
        })
      )
      .subscribe((validatedTool: ValidatedTool) => {
        this.store.dispatch({
          type: SET_VALIDATED_TOOL,
          payload: validatedTool,
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

  private subscribeToJobEvents() {
    this.sessionEventService
      .getJobStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
          this.updateJobs();
        },
        (err) => this.errorService.showError("failed to update jobs", err)
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
        "Find tool"
      )
    );
  }
}
