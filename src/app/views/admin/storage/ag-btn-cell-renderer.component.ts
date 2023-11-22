import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "ch-ag-btn-cell-renderer",
  template: `
    <div>
      <button *ngIf="params.onSessions" class="btn btn-secondary btn-sm" (click)="onSessions()">Sessions</button>
      <button *ngIf="params.onDelete" class="btn btn-danger btn-sm ms-2" (click)="onDelete()">Delete</button>
      <button *ngIf="params.onDeleteSessions" class="btn btn-danger btn-sm ms-2" (click)="onDeleteSessions()">
        Delete sessions
      </button>
    </div>
  `,
})
export class AgBtnCellRendererComponent implements ICellRendererAngularComp {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
  public label: string;
  public params: any;

  agInit(params: any): void {
    this.params = params;
    this.label = params.label;
  }

  onSessions() {
    this.params.onSessions(this.params.data);
  }

  onDelete() {
    this.params.onDelete(this.params.data);
  }

  onDeleteSessions() {
    this.params.onDeleteSessions(this.params.data);
  }
}
