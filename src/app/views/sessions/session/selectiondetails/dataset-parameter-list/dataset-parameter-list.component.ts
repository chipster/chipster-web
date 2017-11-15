import {Component, Input, OnChanges, SimpleChanges, SimpleChange} from '@angular/core';
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
                <tr class="text-sm" *ngFor="let param of parameterListForView; let i = index"  [ngStyle]="{'color': param.isDefaultValue? 'gray' : 'black'}">
                   <ng-template [ngIf]="i < limit">
                      <td>{{param.displayName}}</td>
                         <td>{{param.value}}</td>
                   </ng-template>
                </tr>
             </table>`

})
export class DatasetParameterListComponent {
  @Input() private tool: Tool;
  @Input() private parameters: Array<JobParameter>;

  private limit: number;
  private defaultLimit: number = 3;
  private buttonText: string;
  private parameterListForView: Array<JobParameter> = [];
  private currentTool: Tool;
  private currentJobParameter: Array<JobParameter>

  constructor(private toolService: ToolService) {
  }

  ngOnInit() {
    this.limit = this.defaultLimit;
    this.buttonText = 'Show all';
  }

  ngOnChanges(changes: any) {
    if (changes) {
      console.log("changes triggered");
      const tool: SimpleChange = changes.tool;
      const parameters: SimpleChange = changes.parameters;

      if (tool) this.currentTool = tool.currentValue;
      if (parameters) this.currentJobParameter = parameters.currentValue;

    }

    if (this.currentTool && this.currentJobParameter) {
      this.orderJobParameterList();
    } else if (!this.currentTool && this.currentJobParameter) {
      //just the show the normal job parameters
      let self = this;
      this.currentJobParameter.forEach(function (JobParameter) {
        JobParameter.isDefaultValue = true;
        self.parameterListForView.push(JobParameter);
      })

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
    this.currentJobParameter.forEach(function (JobParameter) {
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
        JobParameter.isDefaultValue = isDefault;
        self.parameterListForView.push(JobParameter);
      }

    });

  }


}
