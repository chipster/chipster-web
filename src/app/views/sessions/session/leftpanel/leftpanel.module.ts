import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WorkflowGraphComponent} from "./workflowgraph/workflowgraph.component";
import {SharedModule} from "../../../../shared/shared.module";
import WorkflowGraphService from "./workflowgraph/workflowgraph.service";

@NgModule({
  imports: [ CommonModule, SharedModule ],
  declarations: [WorkflowGraphComponent],
  providers: [WorkflowGraphService]
})
export class LeftPanelModule { }
