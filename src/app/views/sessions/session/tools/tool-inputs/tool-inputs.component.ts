import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core";
import { Dataset, InputBinding, ToolInput } from "chipster-js-common";
import * as _ from "lodash";
import { SessionData } from "../../../../../model/session/session-data";
import UtilsService from "../../../../../shared/utilities/utils";
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
  styleUrls: ["./tool-inputs.component.less"],
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
      this.bindingModels = this.validatedTool.inputBindings.map((b) => ({
        input: b.toolInput,
        boundDatasets: b.datasets.slice(),
        compatibleDatasets: this.validatedTool.selectedDatasets.filter(
          (dataset: Dataset) =>
            this.toolService.isCompatible(
              this.sessionData,
              dataset,
              b.toolInput.type.name
            )
        ),
      }));
    } else {
      this.ready = false;
    }
  }

  inputSelected(userEditedBinding: BindingModel) {
    // generate new input bindings: remove from other bindings the datasets which are present in the binding
    // edited by the user
    // also automatically bind the rest if there's only one way to do the binding

    // remove user selected file from other bindings
    const otherBindingModels = this.bindingModels.filter(
      (bindingModel) => bindingModel !== userEditedBinding
    );
    otherBindingModels.forEach(
      (bindingModel) =>
        (bindingModel.boundDatasets = _.difference(
          bindingModel.boundDatasets,
          userEditedBinding.boundDatasets
        ))
    );

    // bind the rest of the inputs if there's only one way to bind them
    // will update bindingModels
    this.autoBindRest(otherBindingModels);

    const updatedBindings: InputBinding[] = this.bindingModels.map(
      (bindingModel) => {
        return {
          toolInput: bindingModel.input,
          datasets: bindingModel.boundDatasets.slice(),
        };
      }
    );

    this.updateBindings.emit({
      tool: this.validatedTool.tool,
      category: this.validatedTool.category,
      module: this.validatedTool.module,
      selectedDatasets: this.validatedTool.selectedDatasets,
      inputBindings: updatedBindings,
    });
  }

  private autoBindRest(otherBindingModels: BindingModel[]) {
    const unboundOtherModels = otherBindingModels.filter(
      (bindingModel) =>
        bindingModel.boundDatasets != null &&
        bindingModel.boundDatasets.length < 1
    );

    // any unbound inputs?
    if (unboundOtherModels.length === 0) {
      return;
    }

    // check that all unbound input types are unique
    const uniqueTypes: Set<string> = new Set(
      unboundOtherModels.map((bindingModel) => bindingModel.input.type.name)
    );
    if (uniqueTypes.size !== unboundOtherModels.length) {
      return;
    }

    // check that for each unbound input, there exists exactly one compatible non-bound dataset
    const currentlyBoundDatasets = [].concat(
      ...this.bindingModels.map((bindingModel) => bindingModel.boundDatasets)
    );

    const compatibleUnboundDatasets: Array<Array<Dataset>> =
      unboundOtherModels.map((bindingModel) =>
        _.difference(bindingModel.compatibleDatasets, currentlyBoundDatasets)
      );

    if (
      compatibleUnboundDatasets.some(
        (datasets: Dataset[]) => datasets.length !== 1
      )
    ) {
      return;
    }

    // check that for each unbound input, a unique file would be bound
    const datasetIdsToBeBound: String[] = []
      .concat(...compatibleUnboundDatasets)
      .map((dataset) => dataset.datasetId);

    if (!UtilsService.onlyHasUniqueValues(datasetIdsToBeBound)) {
      return;
    }

    // all checks passed, bind unbound inputs by updating bindingModels
    unboundOtherModels.forEach((bindingModel) => {
      bindingModel.boundDatasets = _.difference(
        bindingModel.compatibleDatasets,
        currentlyBoundDatasets
      );
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
