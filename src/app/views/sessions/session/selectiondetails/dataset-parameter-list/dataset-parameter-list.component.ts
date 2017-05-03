import {Component, Input} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";

@Component({
  selector: 'ch-dataset-parameter-list',
  template: `<span class="h5">
                Parameters
                <span class="lighter" *ngIf="parameters.length > defaultLimit"> {{limit}} of {{parameters.length}}</span>
             </span>
             <span *ngIf="parameters.length > defaultLimit" ><a class="pull-right" (click)="toggleParameterList()">{{buttonText}}</a></span>
                
             <table class="table table-condensed parameter-table">
                <tr *ngFor="let param of parameters; let i = index">
                   <ng-template [ngIf]="i < limit">
                      <td>{{param.displayName}}</td>
                         <td>{{param.value}}</td>
                   </ng-template>
                </tr>
             </table>`
})
export class DatasetParameterListComponent {

  @Input() parameters: Array<JobParameter>;

  private limit: number;
  private defaultLimit: number = 3;
  private buttonText: string;

  constructor() {
  }

  ngOnInit() {
    this.limit = this.defaultLimit;
    this.buttonText = 'Show all';
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

}
