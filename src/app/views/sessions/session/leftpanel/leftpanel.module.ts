import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WorkflowGraphComponent} from "./workflowgraph/workflowgraph.component";
import {SharedModule} from "../../../../shared/shared.module";
import WorkflowGraphService from "./workflowgraph/workflowgraph.service";
import {LeftPanelComponent} from "./leftpanel.component";
import {FormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {AddDatasetModalComponent} from "./adddatasetmodal/adddatasetmodal.component";
import {AddDatasetModalContent} from "./adddatasetmodal/adddatasetmodal.content";
import UploadService from "../../../../shared/services/upload.service";
import {SessionNameModalModule} from "./sessionnamemodal/sessionname.module";

@NgModule({
  imports: [ CommonModule, SharedModule, FormsModule, NgbModule, SessionNameModalModule ],
  declarations: [WorkflowGraphComponent, LeftPanelComponent, AddDatasetModalComponent, AddDatasetModalContent],
  providers: [WorkflowGraphService, UploadService],
  exports: [LeftPanelComponent, WorkflowGraphComponent],
  entryComponents: [AddDatasetModalContent]
})
export class LeftPanelModule { }
