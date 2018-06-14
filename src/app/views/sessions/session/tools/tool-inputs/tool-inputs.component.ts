import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import InputBinding from "../../../../../model/session/inputbinding";
import Tool from "../../../../../model/session/tool";
import { ToolService } from "../tool.service";
import Dataset from "../../../../../model/session/dataset";
import { SessionData } from "../../../../../model/session/session-data";
import * as _ from "lodash";
import log from "loglevel";

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

  inputDescription: string;
  localInputBindings: InputBinding[];

  //noinspection JSUnusedLocalSymbols
  constructor(private toolService: ToolService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["inputBindings"]) {
      // create copy of the datasets property of each InputBinding as it's used as the model of the select
      // element in the template (and thus get's modified)

      this.localInputBindings = this.inputBindings.map(b => ({
        toolInput: b.toolInput,
        datasets: b.datasets.slice()
      }));

      log.info("input bindings", this.localInputBindings);
      log.info(
        "updated bindings:",
        this.getBindingsString(this.localInputBindings)
      );
    }
  }

  inputSelected(userEditedBinding: InputBinding) {
    log.info("input selected");
    // generate new input bindings: remove from other bindings the datasets which are present in the binding
    // edited by the user
    const updatedBindings = this.localInputBindings.map(binding => {
      if (binding.toolInput === userEditedBinding.toolInput) {
        return {
          toolInput: binding.toolInput,
          datasets: binding.datasets.slice()
        };
      } else {
        return {
          toolInput: binding.toolInput,
          datasets: _.difference(binding.datasets, userEditedBinding.datasets)
        };
      }
    });

    this.updateBindings.emit(updatedBindings);
  }

  setInputDescription(description: string) {
    this.inputDescription = description;
  }

  // noinspection JSMethodCanBeStatic
  getBindingsString(bindings: InputBinding[]) {
    let s = "";
    if (!bindings || bindings.length < 1) {
      return s;
    }

    s += "-----\n";

    for (const binding of bindings) {
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
}
