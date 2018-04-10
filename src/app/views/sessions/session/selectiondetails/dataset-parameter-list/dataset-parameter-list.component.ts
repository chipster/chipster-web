import { Component, Input, OnChanges, OnInit } from "@angular/core";
import JobParameter from "../../../../../model/session/jobparameter";
import { ToolService } from "../../tools/tool.service";
import Tool from "../../../../../model/session/tool";
import * as _ from "lodash";

@Component({
  selector: "ch-dataset-parameter-list",
  templateUrl: "./dataset-parameter-list.component.html",
  styleUrls: ["./dataset-parameter-list.component.less"]
})
export class DatasetParameterListComponent implements OnChanges, OnInit {
  @Input() private tool: Tool;
  @Input() private parameters: Array<JobParameter>;

  showAll = false;
  limit: number;
  defaultLimit = 3;
  buttonText: string;

  // noinspection JSMismatchedCollectionQueryUpdate
  parameterListForView: Array<JobParameter> = [];
  isDefaultValueMap: Map<JobParameter, boolean> = new Map();

  constructor(private toolService: ToolService) {}

  ngOnInit() {
    this.udpateLimits();
  }

  ngOnChanges(changes: any) {
    let tool = null;
    let parameters = null;

    if (changes.tool != null) {
      tool = changes.tool.currentValue;
    }

    if (changes.parameters != null) {
      parameters = changes.parameters.currentValue;
    }

    this.parameterListForView = [];

    if (parameters) {
      this.showWithTool(parameters, tool);
    }

    // number of params may change if all parameters are shown when a new dataset is selected
    this.udpateLimits();
  }

  udpateLimits() {
    if (this.showAll) {
      this.limit = this.parameterListForView.length;
      this.buttonText = "Show less";
    } else {
      this.limit = this.defaultLimit;
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
