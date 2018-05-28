import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WorkflowGraphComponent } from "./workflow-graph/workflow-graph.component";
import { SharedModule } from "../../../../shared/shared.module";
import { WorkflowGraphService } from "./workflow-graph/workflow-graph.service";
import { SessionPanelComponent } from "./session-panel.component";
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
    SessionPanelComponent,
    UploadModalComponent,
    UploadComponent
  ],
  providers: [WorkflowGraphService, UploadService, DatasetsearchPipe],
  exports: [SessionPanelComponent, WorkflowGraphComponent],
  entryComponents: [UploadModalComponent]
})
export class SessionPanelModule {}
