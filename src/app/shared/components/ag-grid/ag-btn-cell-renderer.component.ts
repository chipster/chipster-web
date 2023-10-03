import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "ag-btn-cell-renderer",
  template: `
    <button (click)="btnClickedHandler($event)">Click me!</button>
  `,
})
export class AgBtnCellRenderer implements ICellRendererAngularComp {
  refresh(params: ICellRendererParams): boolean {
    throw new Error("Method not implemented.");
  }
  private params: any;

  agInit(params: any): void {
    this.params = params;
  }

  btnClickedHandler() {
    this.params.clicked(this.params.value);
  }
}
