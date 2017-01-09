import {Component, Input} from '@angular/core';
import JobParameter from "../../../../../model/session/jobparameter";

@Component({
  selector: 'ch-dataset-parameter-list',
  template: `<h5>Parameters {{parameters.length}} <button *ngIf="parameters.length > 3" (click)="toggleParameterList()" class="pull-right btn btn-xs btn-default">Show/Hide parameters</button></h5>
                <table class="table table-condensed parameter-table">
                      <tr *ngFor="let param of parameters; let i = index">
                          <template [ngIf]="i < limit">
                              <td>{{param.displayName}}</td>
                              <td>{{param.value}}</td>
                          </template>
                      </tr>
                </table>`
})
export class DatasetParameterListComponent {

  @Input() parameters: Array<JobParameter>;

  private limit: number;

  constructor() {
  }

  ngOnInit() {
    this.limit = 3;
  }

  toggleParameterList() {
    this.limit = this.limit === 3 ? this.parameters.length : 3;
  }

}
