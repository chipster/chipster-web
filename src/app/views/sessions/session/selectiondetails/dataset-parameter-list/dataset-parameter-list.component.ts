import { Component, Input, OnChanges, OnInit } from "@angular/core";
import { Tool, JobParameter } from "chipster-js-common";
import { ToolService } from "../../tools/tool.service";
import * as _ from "lodash";

@Component({
  selector: "ch-dataset-parameter-list",
  templateUrl: "./dataset-parameter-list.component.html",
  styleUrls: ["./dataset-parameter-list.component.less"]
})
export class DatasetParameterListComponent implements OnChanges {
  @Input() private tool: Tool;
  @Input() private parameters: Array<JobParameter>;
  @Input() private parametersLimit: number;

  noLimit = false;
  showAll = false;
  limit: number;
  defaultLimit = 3;
  buttonText: string;

  currentTool: Tool = null;

  // noinspection JSMismatchedCollectionQueryUpdate
  parameterListForView: Array<JobParameter> = [];
  isDefaultValueMap: Map<JobParameter, boolean> = new Map();

  constructor(private toolService: ToolService) {}

  ngOnChanges(changes: any) {
    let parameters = null;

    if (changes.tool != null) {
      // tool doesn't change if you several datasets were produced by the same tool
      this.currentTool = changes.tool.currentValue;
    }

    if (changes.parameters != null) {
      parameters = changes.parameters.currentValue;
    }

    this.parameterListForView = [];

    if (parameters) {
      this.showWithTool(parameters, this.currentTool);
    }

    // number of params may change if all parameters are shown when a new dataset is selected
    this.udpateLimits();
  }

  udpateLimits() {
    if (this.parametersLimit < 0) {
      this.noLimit = true;
    }

    if (this.noLimit || this.showAll) {
      this.limit = this.parameterListForView.length;
      this.buttonText = "Show less";
    } else {
      this.limit = this.parametersLimit;
      this.buttonText = "Show all";
    }
  }

  toggleParameterList() {
    this.showAll = !this.showAll;
    this.udpateLimits();
  }

  showWithTool(parameters: JobParameter[], tool: Tool) {
    this.isDefaultValueMap = new Map();

    parameters.forEach(jobParameter => {
      const clone = _.clone(jobParameter);
      let isDefault = false;

      if (tool) {
        const toolParameter = tool.parameters.find(
          p => p.name.id === jobParameter.parameterId
        );

        if (toolParameter) {
          // get the parameters display name from the tool
          clone.displayName = toolParameter.name.displayName;

          // if an enum parameter
          if (toolParameter.selectionOptions) {
            // find the value's display name from the tool
            const toolOption = toolParameter.selectionOptions.find(
              o => o.id === jobParameter.value
            );
            if (toolOption) {
              if (toolOption.displayName) {
                clone.value = toolOption.displayName;
              }
            } else {
              console.warn(
                "job parameter value" +
                  jobParameter.value +
                  "not found from the current tool " +
                  "paramater options, showing the id"
              );
            }
          }

          isDefault = this.toolService.isDefaultValue(
            toolParameter,
            jobParameter.value
          );
        }
      }
      this.isDefaultValueMap.set(clone, isDefault);
      this.parameterListForView.push(clone);
    });

    this.parameterListForView.filter(p => p.displayName == null).forEach(p => {
      p.displayName = p.parameterId;
    });
  }
}
