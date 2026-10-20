import { NgModule } from "@angular/core";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { UploadService } from "../../../../shared/services/upload.service";
import { WorkflowGraphService } from "./workflow-graph/workflow-graph.service";

@NgModule({
  providers: [WorkflowGraphService, UploadService, DatasetsearchPipe],
})
export class SessionPanelModule {}
