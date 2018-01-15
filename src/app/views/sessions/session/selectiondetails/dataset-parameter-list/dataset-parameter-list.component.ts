import {Component, Input, OnChanges} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";
import {ToolService} from "../../tools/tool.service";
import Tool from "../../../../../model/session/tool";

@Component({
  selector: 'ch-dataset-parameter-list',
  template: `<span class="h6" *ngIf="parameterListForView.length > 0">
                Parameters
                <span class="lighter" *ngIf="parameterListForView.length > defaultLimit"> {{limit}} of {{parameterListForView.length}}</span>
             </span>
             <span *ngIf="parameterListForView.length > defaultLimit" ><ch-link-button class="pull-right" (click)="toggleParameterList()">{{buttonText}}</ch-link-button></span>
                
             <table class="table table-sm parameter-table">
                <tr class="text-sm" *ngFor="let param of parameterListForView; let i = index"  [ngStyle]="{'color': isDefaultValueMap.get(param)? 'gray' : 'black'}">
                   <ng-template [ngIf]="i < limit">
                      <td>{{param.displayName}}</td>
                         <td>{{param.value}}</td>
                   </ng-template>
                </tr>
             </table>`

})
export class DatasetParameterListComponent implements OnChanges {
  @Input() private tool: Tool;
  @Input() private parameters: Array<JobParameter>;

  private limit: number;
  private defaultLimit: number = 3;
  private buttonText: string;
  // noinspection JSMismatchedCollectionQueryUpdate
  private parameterListForView: Array<JobParameter> = [];
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
