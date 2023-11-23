import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "ch-ag-btn-cell-renderer",
  templateUrl: "./ag-btn-cell-renderer.component.html",
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

  onShowSessions() {
    this.params.onShowSessions(this.params.data);
  }

  onDeleteUser() {
    this.params.onDeleteUser(this.params.data);
  }

  onDeleteSessions() {
    this.params.onDeleteSessions(this.params.data);
  }
}
