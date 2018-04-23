import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WorkflowGraphComponent } from "./workflowgraph/workflowgraph.component";
import { SharedModule } from "../../../../shared/shared.module";
import { WorkflowGraphService } from "./workflowgraph/workflowgraph.service";
import { LeftPanelComponent } from "./leftpanel.component";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { UploadComponent } from "./upload/upload.component";
import { UploadModalComponent } from "./upload/upload-modal.component";
import { UploadService } from "../../../../shared/services/upload.service";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule],
  declarations: [
    WorkflowGraphComponent,
    LeftPanelComponent,
    UploadModalComponent,
    UploadComponent
  ],
  providers: [WorkflowGraphService, UploadService, DatasetsearchPipe],
  exports: [LeftPanelComponent, WorkflowGraphComponent],
  entryComponents: [UploadModalComponent]
})
export class LeftPanelModule {}
