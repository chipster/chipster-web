import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WorkflowGraphComponent} from "./workflowgraph/workflowgraph.component";
import {SharedModule} from "../../../../shared/shared.module";

@NgModule({
  imports: [ CommonModule, SharedModule ],
  declarations: [WorkflowGraphComponent]
})
export class LeftPanelModule { }
