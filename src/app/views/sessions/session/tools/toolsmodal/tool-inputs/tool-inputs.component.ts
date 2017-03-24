import {Component, OnInit, Input} from '@angular/core';
import {ToolResource} from "../../../../../../shared/resources/toolresource";
import InputBinding from "../../../../../../model/session/inputbinding";
import Tool from "../../../../../../model/session/tool";
import {ToolService} from "../../tool.service";
import Dataset from "../../../../../../model/session/dataset";

@Component({
  selector: 'ch-tool-inputs',
  templateUrl: './tool-inputs.component.html',
})
export class ToolInputsComponent implements OnInit {

  @Input() tool: Tool;
  @Input() inputBindings: InputBinding[];
  @Input() selectedDatasets: Dataset[];


  constructor(private toolService: ToolService,
              private toolResource: ToolResource) { }

  ngOnInit() {
  }

  inputSelected(changedBinding: InputBinding) {

    // unselect selection(s) of changed binding from other bindings
    for (let otherBinding of this.inputBindings.filter(inputBinding => inputBinding !== changedBinding)) {
      for (let changed of changedBinding.datasets) {
        for (let dataset of otherBinding.datasets) {
          if (changed.datasetId === dataset.datasetId) {
            _.pull(otherBinding.datasets, dataset);
          }
        }
      }
    }
  }
}
