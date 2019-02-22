import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { Tool, ToolParameter } from "chipster-js-common";
import { ToolService } from "../tool.service";
import {
  ToolSelectionService,
  ParametersValidationResult,
  ParameterValidationResult
} from "../../tool.selection.service";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs/Subject";
import { takeUntil, tap } from "rxjs/operators";

@Component({
  selector: "ch-tool-parameters",
  templateUrl: "./tool-parameters.component.html",
  styleUrls: ["./tool-parameters.component.less"]
})
export class ToolParametersComponent implements OnInit, OnDestroy {
  @Input() tool: Tool;

  ready = false;
  parametersValid: boolean;
  validationResults: Map<string, ParameterValidationResult>;
  inputsValid: boolean;
  showWarning: boolean;
  warningText: string;

  private validateThrottle = new Subject<any>();

  private unsubscribe: Subject<any> = new Subject();

  // noinspection JSUnusedLocalSymbols
  constructor(
    public toolService: ToolService,
    public toolSelectionService: ToolSelectionService,
    private dropDown: NgbDropdown
  ) {}

  ngOnInit() {
    this.toolSelectionService.inputsValid$
      .pipe(
        takeUntil(this.unsubscribe),
        tap(inputsOk => {
          this.inputsValid = inputsOk;
          this.updateWarning();
        })
      )
      .subscribe();

    this.toolSelectionService.parametersValidWithResults$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((validationResult: ParametersValidationResult) => {
          this.parametersValid = validationResult.valid;
          this.validationResults = validationResult.parameterResults;

          this.updateWarning();
          this.ready =
            (validationResult.parameterResults !== null &&
              validationResult.parameterResults.size > 0) ||
            validationResult.parameterResults.size === 0;
        })
      )
      .subscribe();

    this.validateThrottle
      .asObservable()
      .debounceTime(500)
      .takeUntil(this.unsubscribe)
      .subscribe(() => {
        this.toolSelectionService.checkParameters();
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  closeDropDownDialog() {
    this.dropDown.close();
  }

  validate() {
    this.validateThrottle.next();
  }

  private updateWarning() {
    this.showWarning = !this.parametersValid || !this.inputsValid;

    if (!this.parametersValid && !this.inputsValid) {
      this.warningText = "Invalid parameters and missing input files";
    } else if (!this.parametersValid) {
      this.warningText = "Invalid parameters";
    } else if (!this.inputsValid) {
      this.warningText = "Missing input files";
    } else {
      this.warningText = "";
    }
  }

  reset(parameter: ToolParameter, $event: Event) {
    // don't close the dropdown
    $event.stopPropagation();

    // if selection options doesn't contain default, set value to null
    const defaultValue = this.toolService.getDefaultValue(parameter);
    if (
      this.toolService.isSelectionParameter(parameter) &&
      !this.toolService.selectionOptionsContains(
        parameter.selectionOptions,
        parameter.defaultValue
      )
    ) {
      parameter.value = null;
    } else {
      parameter.value = defaultValue;
    }
    this.toolSelectionService.checkParameters();
  }

  public getDisplayName(obj) {
    return this.toolService.getDisplayName(obj);
  }

  resetVisible(parameter: ToolParameter): boolean {
    if (
      this.toolService.isSelectionParameter(parameter) &&
      !this.toolService.isDefaultValue(parameter, parameter.value) &&
      !this.toolService.selectionOptionsContains(
        parameter.selectionOptions,
        parameter.value
      )
    ) {
      return false;
    } else {
      return !this.toolService.isDefaultValue(parameter, parameter.value);
    }
  }
}
