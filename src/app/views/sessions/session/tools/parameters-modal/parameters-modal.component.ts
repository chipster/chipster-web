import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SessionData } from "../../../../../model/session/session-data";
import { SelectedToolWithInputs, ValidatedTool } from "../ToolSelection";
import { Tool } from "chipster-js-common";
import {
  NgbAccordionDirective,
  NgbAccordionItem,
  NgbAccordionHeader,
  NgbAccordionToggle,
  NgbAccordionButton,
  NgbAccordionCollapse,
  NgbAccordionBody,
} from "@ng-bootstrap/ng-bootstrap/accordion";
import { NgbCollapse } from "@ng-bootstrap/ng-bootstrap/collapse";
import { ToolParametersComponent } from "../tool-parameters/tool-parameters.component";
import { ToolInputsComponent } from "../tool-inputs/tool-inputs.component";
import { RunOptionsComponent } from "../run-options/run-options.component";
import { ToolResourcesComponent } from "../tool-resources/tool-resources.component";

@Component({
  selector: "ch-parameters-modal",
  templateUrl: "./parameters-modal.component.html",
  styleUrls: ["./parameters-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionToggle,
    NgbAccordionButton,
    NgbCollapse,
    NgbAccordionCollapse,
    NgbAccordionBody,
    ToolParametersComponent,
    ToolInputsComponent,
    RunOptionsComponent,
    ToolResourcesComponent,
  ],
})
export class ParametersModalComponent {
  constructor(public activeModal: NgbActiveModal) {}

  @Input() validatedTool: ValidatedTool;
  @Input() sessionData: SessionData;
  @Input() origTool: Tool;
  @Output() parametersChanged = new EventEmitter();
  @Output() updateBindings = new EventEmitter();
  @Output() resourcesChanged = new EventEmitter();

  setBindings(toolWithInputs: SelectedToolWithInputs) {
    this.updateBindings.emit(toolWithInputs);
  }

  onParametersChanged() {
    this.parametersChanged.emit();
  }

  onResourcesChanged() {
    this.resourcesChanged.emit();
  }
}
