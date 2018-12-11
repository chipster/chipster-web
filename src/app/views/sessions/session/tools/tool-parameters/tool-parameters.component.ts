import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { Tool, ToolParameter } from "chipster-js-common";
import { ToolService } from "../tool.service";
import { ToolSelectionService } from "../../tool.selection.service";
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

  parametersValid: boolean;
  inputsValid: boolean;
  showWarning: boolean;
  warningText: string;

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

    this.toolSelectionService.parametersValid$
      .pipe(
        takeUntil(this.unsubscribe),
        tap(parametersOk => {
          this.parametersValid = parametersOk;
          this.updateWarning();
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  closeDropDownDialog() {
    this.dropDown.close();
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
    parameter.value = this.toolService.getDefaultValue(parameter);
  }

  public getDisplayName(obj) {
    return this.toolService.getDisplayName(obj);
  }
}
