import {Component, Input, OnChanges, SimpleChanges, SimpleChange} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";
import {ToolService} from "../../tools/tool.service";
import Tool from "../../../../../model/session/tool";

@Component({
  selector: 'ch-dataset-parameter-list',
  template: `<span class="h5">
                Parameters
                <span class="lighter" *ngIf="parameters.length > defaultLimit"> {{limit}} of {{parameterListForView.length}}</span>
             </span>
             <span *ngIf="parameterListForView.length > defaultLimit" ><ch-link-button class="pull-right" (click)="toggleParameterList()">{{buttonText}}</ch-link-button></span>
                
             <table class="table table-condensed parameter-table">
                <tr *ngFor="let param of parameterListForView; let i = index"  [ngStyle]="{'color': param.isDefaultValue? 'gray' : 'black'}">
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
    if(changes){
      const tool: SimpleChange = changes.tool;
      const parameters: SimpleChange = changes.parameters;

      this.currentTool = tool.currentValue;
      this.currentJobParameter = parameters.currentValue;
    }else{
      this.currentTool=this.tool;
      this.currentJobParameter=this.parameters;
    }

    if (this.currentTool && this.currentJobParameter) {
      this.orderJobParameterList();
    } else {
      console.log('cannot set default parameter values because the tools is undefined', this.currentTool);
    }
    //console.log(this.currentTool.parameters);
    //console.log(this.tool);

  }

  toggleParameterList() {
    if (this.limit === this.defaultLimit) {
      this.limit = this.parameters.length;
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
      self.parameterListForView[i] = JobParameter;
      self.parameterListForView[i].displayName = self.currentTool.parameters[i].name.displayName;
      self.parameterListForView[i].isDefaultValue = self.toolService.isDefaultValue(self.currentTool.parameters[i], self.parameterListForView[i].value);
      console.log(self.parameterListForView[i].isDefaultValue);
    });

    console.log(this.parameterListForView);
  }


}
