import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { InputBinding, Tool, Dataset, ToolInput } from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { SessionData } from "../../../../../model/session/session-data";
import { ToolService } from "../tool.service";

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
  @Input() tool: Tool;
  @Input() inputBindings: InputBinding[];
  @Input() selectedDatasets: Dataset[];
  @Output() updateBindings = new EventEmitter();

  bindingModels: BindingModel[];

  //noinspection JSUnusedLocalSymbols
  constructor(private toolService: ToolService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["inputBindings"]) {
      // create copy of the datasets property of each InputBinding as it's used as the model of the select
      // element in the template (and thus get's modified)

      this.bindingModels = this.inputBindings.map(b => ({
        input: b.toolInput,
        boundDatasets: b.datasets.slice(),
        compatibleDatasets: this.selectedDatasets.filter((dataset: Dataset) =>
          this.toolService.isCompatible(
            this.sessionData,
            dataset,
            b.toolInput.type.name
          )
        )
      }));

      log.info(
        "new bindings:\n" +
          this.getBindingsString(this.getBindingsArray(this.bindingModels))
      );
    }
  }

  inputSelected(userEditedBinding: BindingModel) {
    log.info("input selected");
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

    this.updateBindings.emit(updatedBindings);
  }

  private getBindingsArray(bindingModels: BindingModel[]) {
    return bindingModels.map(bindingModel => {
      return {
        toolInput: bindingModel.input,
        datasets: bindingModel.boundDatasets
      };
    });
  }

  // noinspection JSMethodCanBeStatic
  getBindingsString(bindings: InputBinding[]) {
    let s = "";
    if (!bindings || bindings.length < 1) {
      return s;
    }

    for (const binding of bindings) {
      s += "\t";
      const datasetsString: string = binding.datasets.reduce(
        (a: string, b) => a + b.name + " ",
        ""
      );

      s += binding.toolInput.name.id
        ? binding.toolInput.name.id
        : binding.toolInput.name.prefix;
      s += " -> " + datasetsString;
      s += "\n";
    }

    return s;
  }

  public getDisplayName(obj) {
    return this.toolService.getDisplayName(obj);
  }
}
