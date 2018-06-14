import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { ToolSelection } from "./tools/ToolSelection";
import InputBinding from "../../../model/session/inputbinding";
import { Observable, Subject } from "rxjs";
import ToolParameter from "../../../model/session/toolparameter";
import { ToolService } from "./tools/tool.service";
import Dataset from "../../../model/session/dataset";
import * as _ from "lodash";
import { SessionData } from "../../../model/session/session-data";
import { SelectionService } from "./selection.service";
import { SET_TOOL_SELECTION } from "../../../state/selected-tool.reducer";

@Injectable()
export class ToolSelectionService implements OnDestroy {
  toolSelection$: Observable<ToolSelection>;
  inputsValid$: Observable<boolean>;
  parametersValid$: Observable<boolean>;
  runEnabled$: Observable<boolean>;

  private currentToolSelection: ToolSelection; // needed for parameter checking
  private parameterChecker$: Subject<boolean> = new Subject();

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private store: Store<any>,
    private toolService: ToolService,
    private selectionService: SelectionService
  ) {
    this.store
      .select("toolSelection")
      .takeUntil(this.unsubscribe)
      .subscribe((toolSelection: ToolSelection) => {
        this.currentToolSelection = toolSelection;

        if (toolSelection) {
          // get bound datasets for populating (dataset dependent) parameters
          const boundDatasets = toolSelection.inputBindings.reduce(
            (datasets: Array<Dataset>, inputBinding: InputBinding) => {
              return datasets.concat(inputBinding.datasets);
            },
            []
          );

          toolSelection.tool.parameters.forEach((parameter: ToolParameter) => {
            this.populateParameterValues(parameter, boundDatasets);
            this.parametersChanged();
          });
        }
      });

    this.toolSelection$ = this.store.select("toolSelection");

    this.inputsValid$ = this.store
      .select("toolSelection")
      .map((toolSelection: ToolSelection) => {
        if (!toolSelection || toolSelection.tool.inputs.length < 1) {
          return true;
        }
        return toolSelection.inputBindings.every((binding: InputBinding) => {
          return binding.toolInput.optional || binding.datasets.length > 0;
        });
      })
      .distinctUntilChanged();

    this.parametersValid$ = this.parameterChecker$
      .asObservable()
      .distinctUntilChanged()
      .startWith(true);

    this.runEnabled$ = Observable.combineLatest(
      this.store.select("toolSelection"),
      this.inputsValid$,
      this.parametersValid$,
      (toolSelection: ToolSelection, inputsValid, parametersValid) => {
        return toolSelection && inputsValid && parametersValid;
      }
    ).distinctUntilChanged();
  }

  selectToolAndBindInputs(
    toolSelection: ToolSelection,
    sessionData: SessionData
  ) {
    console.log("selecting tool: ", toolSelection.tool.name.displayName);
    toolSelection.inputBindings = this.toolService.bindInputs(
      sessionData,
      toolSelection.tool,
      this.selectionService.selectedDatasets
    );

    this.store.dispatch({ type: SET_TOOL_SELECTION, payload: toolSelection });
  }

  parametersChanged() {
    this.parameterChecker$.next(this.checkCurrentToolParameters());
  }

  checkCurrentToolParameters(): boolean {
    if (
      !this.currentToolSelection ||
      !this.currentToolSelection.tool.parameters ||
      this.currentToolSelection.tool.parameters.length < 1
    ) {
      return true;
    } else {
      return this.currentToolSelection.tool.parameters.every(
        (parameter: ToolParameter) => {
          return (
            parameter.optional ||
            // not null and not undefined and not an empty string, but 0 is fine
            (parameter.value != null && parameter.value !== "")
          );
        }
      );
    }
  }

  populateParameterValues(parameter: ToolParameter, datasets: Array<Dataset>) {
    if (!parameter.value) {
      parameter.value = this.toolService.getDefaultValue(parameter);
    }

    if (datasets && datasets.length > 0 && parameter.type === "COLUMN_SEL") {
      Observable.forkJoin(
        this.toolService.getDatasetHeaders(datasets)
      ).subscribe((datasetsHeaders: Array<Array<string>>) => {
        const columns = _.uniq(_.flatten(datasetsHeaders));
        parameter.selectionOptions = columns.map(function(column) {
          return { id: column };
        });

        // reset value to empty if previous value is now invalid, unless it's the default
        if (
          parameter.value &&
          parameter.value !== this.toolService.getDefaultValue(parameter) &&
          !this.toolService.selectionOptionsContains(
            parameter.selectionOptions,
            parameter.value
          )
        ) {
          parameter.value = null;
        }
      });
    }

    if (
      datasets &&
      datasets.length > 0 &&
      parameter.type === "METACOLUMN_SEL"
    ) {
      parameter.selectionOptions = this.toolService
        .getMetadataColumns(datasets)
        .map(function(column) {
          return { id: column };
        });

      // reset value to empty if previous value is now invalid, unless it's the default
      if (
        parameter.value &&
        parameter.value !== this.toolService.getDefaultValue(parameter) &&
        !this.toolService.selectionOptionsContains(
          parameter.selectionOptions,
          parameter.value
        )
      ) {
        parameter.value = null;
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
