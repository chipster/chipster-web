import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges
} from "@angular/core";
import { Dataset, ToolInput } from "chipster-js-common";
import * as _ from "lodash";
import { SessionData } from "../../../../../model/session/session-data";
import { ToolService } from "../tool.service";
import { ValidatedTool } from "../ToolSelection";

interface BindingModel {
  input: ToolInput;
  boundDatasets: Dataset[];
  compatibleDatasets: Dataset[];
}

@Component({
  selector: "ch-tool-inputs",
  templateUrl: "./tool-inputs.component.html",
  styleUrls: ["./tool-inputs.component.less"]
})
export class ToolInputsComponent implements OnChanges {
  @Input() sessionData: SessionData;
  @Input() validatedTool: ValidatedTool;
  @Output() updateBindings = new EventEmitter();

  bindingModels: BindingModel[];
  ready = false;

  //noinspection JSUnusedLocalSymbols
  constructor(private toolService: ToolService) {}

  ngOnChanges() {
    if (this.validatedTool != null) {
      this.ready = true;
      // create copy of the datasets property of each InputBinding as it's used as the model of the select
      // element in the template (and thus get's modified)
      this.bindingModels = this.validatedTool.inputBindings.map(b => ({
        input: b.toolInput,
        boundDatasets: b.datasets.slice(),
        compatibleDatasets: this.validatedTool.selectedDatasets.filter(
          (dataset: Dataset) =>
            this.toolService.isCompatible(
              this.sessionData,
              dataset,
              b.toolInput.type.name
            )
        )
      }));
    } else {
      this.ready = false;
    }
  }

  inputSelected(userEditedBinding: BindingModel) {
    // generate new input bindings: remove from other bindings the datasets which are present in the binding
    // edited by the user
    const updatedBindings = this.bindingModels.map(bindingModel => {
      if (bindingModel.input === userEditedBinding.input) {
        return {
          toolInput: bindingModel.input,
          datasets: bindingModel.boundDatasets.slice()
        };
      } else {
        return {
          toolInput: bindingModel.input,
          datasets: _.difference(
            bindingModel.boundDatasets,
            userEditedBinding.boundDatasets
          )
        };
      }
    });
    this.updateBindings.emit({
      tool: this.validatedTool.tool,
      category: this.validatedTool.category,
      module: this.validatedTool.module,
      selectedDatasets: this.validatedTool.selectedDatasets,
      inputBindings: updatedBindings
    });
  }

  getDisplayName(obj) {
    return this.toolService.getDisplayName(obj);
  }

  getPhenodataInputs() {
    return this.validatedTool.tool.inputs.filter(
      (input: ToolInput) => input.meta
    );
  }
}
