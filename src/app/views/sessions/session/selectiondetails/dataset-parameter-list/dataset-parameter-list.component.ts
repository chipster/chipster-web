import {Component, Input} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";
import {ToolService} from "../../tools/tool.service";
import Tool from "../../../../../model/session/tool";

@Component({
  selector: 'ch-dataset-parameter-list',
  template: `<span class="h5">
                Parameters
                <span class="lighter" *ngIf="parameters.length > defaultLimit"> {{limit}} of {{parameters.length}}</span>
             </span>
             <span *ngIf="parameters.length > defaultLimit" ><ch-link-button class="pull-right" (click)="toggleParameterList()">{{buttonText}}</ch-link-button></span>
                
             <table class="table table-condensed parameter-table">
                <tr *ngFor="let param of parameters; let i = index"  [ngStyle]="{'color': param.isDefaultValueChanged? 'gray' : 'black'}">
                   <ng-template [ngIf]="i < limit">
                      <td>{{param.displayName}}</td>
                         <td>{{param.value}}</td>
                   </ng-template>
                </tr>
             </table>`
})
export class DatasetParameterListComponent {
  @Input() tool: Tool;
  @Input() parameters: Array<JobParameter>;

  private limit: number;
  private defaultLimit: number = 3;
  private buttonText: string;

  constructor(private toolService: ToolService) {
  }

  ngOnInit() {
    this.limit = this.defaultLimit;
    this.buttonText = 'Show all';
    this.checkParameterValue();

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

  checkParameterValue(){
    let self=this;
    this.parameters.forEach(function(param){
      self.tool.parameters.forEach(function(toolParameter) {
        param.isDefaultValueChanged=self.toolService.isDefaultValue(toolParameter,param.value);
      });
    });



  }




}
