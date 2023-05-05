import { Component, Input, OnChanges } from "@angular/core";
import { JobParameter, Tool } from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { ToolService } from "../../tools/tool.service";

@Component({
  selector: "ch-dataset-parameter-list",
  templateUrl: "./dataset-parameter-list.component.html",
  styleUrls: ["./dataset-parameter-list.component.less"],
})
export class DatasetParameterListComponent implements OnChanges {
  @Input() tool: Tool;
  @Input() parameters: Array<JobParameter>;
  @Input() parametersLimit: number;
  @Input() historyMode = false;

  noLimit = false;
  showAll = false;
  defaultLimit = 3;
  limit: number = this.defaultLimit;
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
    this.updateLimits();
  }

  updateLimits() {
    this.limit = this.parametersLimit == null ? this.defaultLimit : this.parametersLimit;
    this.noLimit = this.parametersLimit < 0;

    if (this.noLimit || this.showAll) {
      this.limit = this.parameterListForView.length;
      this.buttonText = "Show less";
    } else {
      this.buttonText = "Show all";
    }
  }

  toggleParameterList() {
    this.showAll = !this.showAll;
    this.updateLimits();
  }

  showWithTool(parameters: JobParameter[], tool: Tool) {
    this.isDefaultValueMap = new Map();
    parameters.forEach((jobParameter) => {
      const clone = _.clone(jobParameter);
      let isDefault = false;

      if (tool) {
        const toolParameter = tool.parameters.find((p) => p.name.id === jobParameter.parameterId);

        if (toolParameter) {
          // get the parameters display name from the tool
          clone.displayName = toolParameter.name.displayName;

          // if an enum parameter
          if (toolParameter.selectionOptions) {
            // find the value's display name from the tool
            const toolOption = toolParameter.selectionOptions.find((o) => o.id === jobParameter.value);
            if (toolOption) {
              if (toolOption.displayName) {
                clone.value = toolOption.displayName;
              }
            } else {
              log.info(
                "job parameter value" +
                  jobParameter.value +
                  "not found from the current tool " +
                  "paramater options, showing the id"
              );
            }
          }

          isDefault = this.toolService.isDefaultValue(toolParameter, jobParameter.value);
        }
      }
      this.isDefaultValueMap.set(clone, isDefault);
      this.parameterListForView.push(clone);
    });

    this.parameterListForView
      .filter((p) => p.displayName == null)
      .forEach((p) => {
        p.displayName = p.parameterId;
      });
  }
}
