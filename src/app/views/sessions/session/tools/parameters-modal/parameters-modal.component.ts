import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SessionData } from "../../../../../model/session/session-data";
import { SelectedToolWithInputs, ValidatedTool } from "../ToolSelection";

@Component({
  selector: "ch-parameters-modal",
  templateUrl: "./parameters-modal.component.html",
  styleUrls: ["./parameters-modal.component.less"],
})
export class ParametersModalComponent {
  constructor(public activeModal: NgbActiveModal) {}

  @Input() validatedTool: ValidatedTool;
  @Input() sessionData: SessionData;
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
