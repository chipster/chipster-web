import {Component, Input, OnChanges} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";
import {ToolService} from "../../tools/tool.service";
import Tool from "../../../../../model/session/tool";

@Component({
  selector: 'ch-dataset-parameter-list',
  templateUrl: './dataset-parameter-list.component.html'
})

export class DatasetParameterListComponent implements OnChanges {
  @Input() private tool: Tool;
  @Input() private parameters: Array<JobParameter>;

  limit: number;
  defaultLimit: number = 3;
  buttonText: string;
  // noinspection JSMismatchedCollectionQueryUpdate
  parameterListForView: Array<JobParameter> = [];
  private currentTool: Tool;
  private currentJobParameter: Array<JobParameter>;

  private isDefaultValueMap: Map<JobParameter, boolean> = new Map();

  constructor(private toolService: ToolService) {
  }

  ngOnInit() {
    this.limit = this.defaultLimit;
    this.buttonText = 'Show all';
  }

  ngOnChanges(changes: any) {
    console.log('parameter changes triggered', changes, changes.tool, changes.tool !== null);

    if (changes.tool != null) {
      this.currentTool = changes.tool.currentValue;
    } else {
      this.currentTool = null;
    }

    if (changes.parameters != null) {
      this.currentJobParameter = changes.parameters.currentValue;
    } else {
      this.currentJobParameter = null;
    }

    this.parameterListForView = [];

    if (this.currentJobParameter) {
      if (this.currentTool) {
        this.orderJobParameterList();

      } else if (!this.currentTool) {
        //just the show the normal job parameters
        let self = this;
        this.currentJobParameter.forEach((JobParameter) => {
          this.isDefaultValueMap.set(JobParameter, true);
          self.parameterListForView.push(JobParameter);
        });
      }
    }
  }

  toggleParameterList() {
    if (this.limit === this.defaultLimit) {
      this.limit = this.parameterListForView.length;
      this.buttonText = 'Hide';
    } else {
      this.limit = this.defaultLimit;
      this.buttonText = 'Show all';
    }
  }

  orderJobParameterList() {
    let self = this;
    this.isDefaultValueMap = new Map();
    this.currentJobParameter.forEach((JobParameter) => {
      let i = self.currentTool.parameters.findIndex(x => x.name.id == JobParameter.parameterId);
      if (i != -1) {
        // if the parameter does not have a display name
        if (self.currentTool.parameters[i].name.displayName) {
          JobParameter.displayName = self.currentTool.parameters[i].name.displayName;
        } else {
          JobParameter.displayName = self.currentTool.parameters[i].name.id;
        }
        let isDefault = self.toolService.isDefaultValue(self.currentTool.parameters[i], JobParameter.value);
        if (isDefault == null) isDefault = true;
        this.isDefaultValueMap.set(JobParameter, isDefault);
        self.parameterListForView.push(JobParameter);
      }

    });

  }


}
