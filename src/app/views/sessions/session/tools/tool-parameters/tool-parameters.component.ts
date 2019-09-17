import { takeUntil, debounceTime } from "rxjs/operators";
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  EventEmitter,
  Output
} from "@angular/core";
import { ToolParameter } from "chipster-js-common";
import { ToolService } from "../tool.service";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { ValidatedTool } from "../ToolSelection";

@Component({
  selector: "ch-tool-parameters",
  templateUrl: "./tool-parameters.component.html",
  styleUrls: ["./tool-parameters.component.less"]
})
export class ToolParametersComponent implements OnInit, OnChanges, OnDestroy {
  @Input() validatedTool: ValidatedTool;
  @Output() parametersChanged: EventEmitter<any> = new EventEmitter();

  ready = false;
  showWarning: boolean;
  warningText: string;

  private parametersChangedThrottle = new Subject<any>();

  private unsubscribe: Subject<any> = new Subject();

  // noinspection JSUnusedLocalSymbols
  constructor(public toolService: ToolService, private dropDown: NgbDropdown) {}

  ngOnInit() {
    this.parametersChangedThrottle
      .asObservable()
      .pipe(
        debounceTime(500),
        takeUntil(this.unsubscribe)
      )
      .subscribe(() => {
        this.parametersChanged.emit();
      });
  }

  ngOnChanges() {
    if (this.validatedTool != null) {
      this.ready = true;
      this.showWarning = !this.validatedTool.valid;
      this.warningText = this.validatedTool.message;
    } else {
      this.ready = false;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  closeDropDownDialog() {
    this.dropDown.close();
  }

  onParametersChanged() {
    this.parametersChangedThrottle.next();
  }

  reset(parameter: ToolParameter, $event?: Event) {
    // don't close the dropdown
    if ($event) {
      $event.stopPropagation();
    }

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
    this.parametersChanged.emit();
  }

  getDisplayName(obj) {
    return this.toolService.getDisplayName(obj);
  }

  isResetVisible(parameter: ToolParameter): boolean {
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
