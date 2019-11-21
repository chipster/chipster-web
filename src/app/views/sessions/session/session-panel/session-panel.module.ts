import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { UploadService } from "../../../../shared/services/upload.service";
import { SharedModule } from "../../../../shared/shared.module";
import { ImportToolComponent } from './import-tool/import-tool.component';
import { SessionPanelComponent } from "./session-panel.component";
import { UploadModalComponent } from "./upload/upload-modal.component";
import { UploadComponent } from "./upload/upload.component";
import { WorkflowGraphComponent } from "./workflow-graph/workflow-graph.component";
import { WorkflowGraphService } from "./workflow-graph/workflow-graph.service";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule, AngularMultiSelectModule],
  declarations: [
    WorkflowGraphComponent,
    SessionPanelComponent,
    UploadModalComponent,
    UploadComponent,
    ImportToolComponent
  ],
  providers: [WorkflowGraphService, UploadService, DatasetsearchPipe],
  exports: [SessionPanelComponent, WorkflowGraphComponent],
  entryComponents: [UploadModalComponent, ImportToolComponent]
})
export class SessionPanelModule { }
