import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import InputBinding from "../../../../../../model/session/inputbinding";
import Tool from "../../../../../../model/session/tool";
import {ToolService} from "../../tool.service";
import Dataset from "../../../../../../model/session/dataset";
import {SessionData} from "../../../../../../model/session/session-data";

@Component({
  selector: 'ch-tool-inputs',
  templateUrl: './tool-inputs.component.html',
})
export class ToolInputsComponent implements OnInit {

  @Input() sessionData: SessionData;
  @Input() tool: Tool;
  @Input() inputBindings: InputBinding[];
  @Input() selectedDatasets: Dataset[];
  @Output() updateBindings = new EventEmitter();

  private inputDescription: string;

  //noinspection JSUnusedLocalSymbols
  constructor(private toolService: ToolService) { }

  ngOnInit() {
  }

  inputSelected(changedBinding: InputBinding) {
    // generate new input bindings: for each input binding
    // copy the previous datasets, except the ones that are present in the
    // binding changed by the user
    let updatedBindings: InputBinding[] = [];
    for (let binding of this.inputBindings) {
      let updatedDatasets = binding.datasets.slice();
      if (changedBinding !== binding) {
        for (let changed of changedBinding.datasets) {
          for (let dataset of binding.datasets) {
            if (changed.datasetId === dataset.datasetId) {
              updatedDatasets = _.pull(updatedDatasets, dataset);
            }
          }
        }
      }
      updatedBindings.push({
        toolInput: binding.toolInput,
        datasets: updatedDatasets});
    }

    this.updateBindings.emit(updatedBindings);
  }

  setInputDescription(description: string) {
    this.inputDescription = description;
  }

}
