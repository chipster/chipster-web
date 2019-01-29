import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { ToolSelection } from "./tools/ToolSelection";
import { InputBinding, ToolParameter, Dataset } from "chipster-js-common";
import { Observable, Subject } from "rxjs";
import { ToolService } from "./tools/tool.service";
import * as _ from "lodash";
import { SessionData } from "../../../model/session/session-data";
import { SelectionService } from "./selection.service";
import { SET_TOOL_SELECTION } from "../../../state/selected-tool.reducer";
import log from "loglevel";
import { ErrorService } from "../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { forkJoin, of } from "rxjs";

export interface ParameterValidationResult {
  valid: boolean;
  message?: string;
}

export interface ParametersValidationResult {
  valid: boolean;
  parameterResults?: Map<string, ParameterValidationResult>;
}

@Injectable()
export class ToolSelectionService implements OnDestroy {
  toolSelection$: Observable<ToolSelection>;
  inputsValid$: Observable<boolean>;
  parametersValid$: Observable<boolean>;
  parametersValidWithResults$: Observable<ParametersValidationResult>;
  runEnabled$: Observable<boolean>;

  private currentToolSelection: ToolSelection; // needed for parameter checking
  private parameterChecker$: BehaviorSubject<
    Map<string, ParameterValidationResult>
  > = new BehaviorSubject(new Map<string, ParameterValidationResult>());

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private store: Store<any>,
    private toolService: ToolService,
    private selectionService: SelectionService,
    private errorService: ErrorService,
    private restErrorService: RestErrorService
  ) {
    // when tool selection changes, populate and check parameters
    this.store
      .select("toolSelection")
      .takeUntil(this.unsubscribe)
      .subscribe(
        (toolSelection: ToolSelection) => {
          this.currentToolSelection = toolSelection;

          if (toolSelection) {
            // get bound datasets for populating (dataset dependent) parameters
            const boundDatasets = toolSelection.inputBindings.reduce(
              (datasets: Array<Dataset>, inputBinding: InputBinding) => {
                return datasets.concat(inputBinding.datasets);
              },
              []
            );

            // populating params is async as some selection options may require dataset contents
            // if there are no params, forkJoin will get empty array and complete immediately
            // this is important to get the param check run even if there are no params
            // as no params means params are valid from the run enabled point of view
            const populateParameterObservables = toolSelection.tool.parameters.map(
              (parameter: ToolParameter) => {
                return this.populateParameterValues(parameter, boundDatasets);
              }
            );

            // populate all the params and run parameters check when populating done
            forkJoin(populateParameterObservables).subscribe({
              complete: () => {
                this.checkParameters();
              },
              error: err => {
                this.restErrorService.showError(
                  "getting parameter values failed",
                  err
                );
              }
            });
          }
        },
        err => this.errorService.showError("tool selection failed", err)
      );

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

    this.parametersValidWithResults$ = this.parameterChecker$
      .asObservable()
      .map((resultsMap: Map<string, ParameterValidationResult>) => {
        return {
          valid: Array.from(resultsMap.values()).every(
            (result: ParameterValidationResult) => result.valid
          ),
          parameterResults: resultsMap
        };
      })
      .startWith({ valid: true })
      .shareReplay(1);

    this.parametersValid$ = this.parametersValidWithResults$
      .map(
        (resultWithErrors: ParameterValidationResult) => resultWithErrors.valid
      )
      .distinctUntilChanged()
      .startWith(true)
      .shareReplay(1);

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
    log.info("selecting tool: ", toolSelection.tool.name.displayName);
    toolSelection.inputBindings = this.toolService.bindInputs(
      sessionData,
      toolSelection.tool,
      this.selectionService.selectedDatasets
    );

    this.store.dispatch({ type: SET_TOOL_SELECTION, payload: toolSelection });
  }

  selectTool(toolSelection: ToolSelection) {
    this.store.dispatch({ type: SET_TOOL_SELECTION, payload: toolSelection });
  }

  checkParameters() {
    this.parameterChecker$.next(this.checkCurrentToolParameters());
  }

  checkCurrentToolParameters(): Map<string, ParameterValidationResult> {
    const resultsMap = new Map<string, ParameterValidationResult>();
    if (
      this.currentToolSelection &&
      this.currentToolSelection.tool.parameters &&
      this.currentToolSelection.tool.parameters.length > 0
    ) {
      this.currentToolSelection.tool.parameters.forEach(
        (parameter: ToolParameter) => {
          resultsMap.set(parameter.name.id, this.checkParameter(parameter));
        }
      );
    }
    return resultsMap;
  }

  checkParameter(parameter: ToolParameter): ParameterValidationResult {
    // required parameter must not be emtpy
    if (!parameter.optional && !this.parameterHasValue(parameter)) {
      return { valid: false, message: "Required parameter can not be empty" };
    }

    // numbers
    if (
      this.parameterHasValue(parameter) &&
      this.toolService.isNumberParameter(parameter)
    ) {
      // integer must be integer
      if (
        parameter.type === "INTEGER" &&
        !Number.isInteger(<number>parameter.value)
      ) {
        return {
          valid: false,
          message: "Value must be an integer"
        };
      }
      // min limit
      if (parameter.from && parameter.value < parameter.from) {
        return {
          valid: false,
          message: "Value must be greater than or equal to " + parameter.from
        };
      }

      // max limit
      if (parameter.to && parameter.value > parameter.to) {
        return {
          valid: false,
          message: "Value must be less than or equal to " + parameter.to
        };
      }
    }

    return { valid: true };
  }

  parameterHasValue(parameter: ToolParameter) {
    return (
      parameter.value !== null &&
      typeof parameter !== "undefined" &&
      String(parameter.value).trim() !== ""
    );
  }

  /**
   * Always return an observable, which emits at least one value and then completes.
   * This is needed because we use forkJoin for combining parameter populating and
   * forkJoin completes immediately if one of the observables complete without
   * emitting anything. Also if one of the observables doesn't complete, forkJoin
   * won't complete.
   */
  populateParameterValues(
    parameter: ToolParameter,
    datasets: Array<Dataset>
  ): Observable<any> {
    // for other than column selection parameters, set to default if no value
    if (
      !this.toolService.isColumnSelectionParameter(parameter) &&
      !parameter.value
    ) {
      parameter.value = this.toolService.getDefaultValue(parameter);
      return of(true);
    }

    // column selection parameters
    if (this.toolService.isColumnSelectionParameter(parameter)) {
      // no datasets --> set to null
      if (datasets && datasets.length < 1) {
        parameter.selectionOptions = [];
        parameter.value = null;
        return of(true);
      }

      // COLUMN_SEL, getting headers is async
      if (parameter.type === "COLUMN_SEL") {
        return Observable.forkJoin(
          this.toolService.getDatasetHeaders(datasets)
        ).map((datasetsHeaders: Array<Array<string>>) => {
          const columns = _.uniq(_.flatten(datasetsHeaders));

          parameter.selectionOptions = columns.map(function(column) {
            return { id: column };
          });
          this.setColumnSelectionParameterValueAfterPopulate(parameter);
          return true;
        });
      } else if (parameter.type === "METACOLUMN_SEL") {
        // METACOLUMN_SEL
        parameter.selectionOptions = this.toolService
          .getMetadataColumns(datasets)
          .map(function(column) {
            return { id: column };
          });

        this.setColumnSelectionParameterValueAfterPopulate(parameter);
        return of(true);
      }
    }

    return of(true); // always return
  }

  private setColumnSelectionParameterValueAfterPopulate(
    parameter: ToolParameter
  ) {
    // set value to null if previous not an option
    if (
      parameter.value != null &&
      !this.toolService.selectionOptionsContains(
        parameter.selectionOptions,
        parameter.value
      )
    ) {
      parameter.value = null;
    }

    // set to default if null and default an option
    // could be null because it was already null, or it was reset above because previous not an option
    if (parameter.value == null) {
      const defaultValue = this.toolService.getDefaultValue(parameter);
      if (
        this.toolService.selectionOptionsContains(
          parameter.selectionOptions,
          defaultValue
        )
      ) {
        parameter.value = defaultValue;
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
