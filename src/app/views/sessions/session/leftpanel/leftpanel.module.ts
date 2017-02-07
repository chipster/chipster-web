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
import {SessionEditModalComponent} from "./sessioneditmodal/sessioneditmodal.component";
import UploadService from "../../../../shared/services/upload.service";

@NgModule({
  imports: [ CommonModule, SharedModule, FormsModule, NgbModule ],
  declarations: [WorkflowGraphComponent, LeftPanelComponent, AddDatasetModalComponent, AddDatasetModalContent, SessionEditModalComponent],
  providers: [WorkflowGraphService, UploadService],
  exports: [LeftPanelComponent],
  entryComponents: [AddDatasetModalContent]
})
export class LeftPanelModule { }
