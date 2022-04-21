import { Component, OnDestroy } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { IAfterGuiAttachedParams, ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "ch-btn-cell-renderer",
  template: `
    <button class="btn btn-sm btn-link" (click)="btnClickedHandler()">{{ buttonLabel }}</button>
  `,
})
export class BtnCellRendererComponent implements ICellRendererAngularComp, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refresh(params: ICellRendererParams): boolean {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {
    throw new Error("Method not implemented.");
  }
  public params: any;
  public buttonLabel: string;

  agInit(params: any): void {
    this.params = params;
    this.buttonLabel = params.userNameAsLabel === true ? params.data.username : params.label;
  }

  btnClickedHandler() {
    this.params.onClick(this.params.getTargetValue(this.params));
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnDestroy() {
    // no need to remove the button click handler
    // https://stackoverflow.com/questions/49083993/does-angular-automatically-remove-template-event-listeners
  }
}
