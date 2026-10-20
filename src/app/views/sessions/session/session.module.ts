import { NgModule } from "@angular/core";
import { UploadService } from "../../../shared/services/upload.service";
import { UserEventService } from "../user-event.service";
import { DatasetService } from "./dataset.service";
import { DialogModalModule } from "./dialogmodal/dialogmodal.module";
import { GetSessionDataService } from "./get-session-data.service";
import { JobService } from "./job.service";
import { LabelsModule } from "./labels/labels.module";
import { ModifiedSessionGuard } from "./modified-session.guard";
import { QuerySessionDataService } from "./query-session-data.service";
import { SelectionHandlerService } from "./selection-handler.service";
import { DatasetModule } from "./selectiondetails/dataset.module";
import { SessionDataService } from "./session-data.service";
import { SessionEventService } from "./session-event.service";
import { SessionPanelModule } from "./session-panel/session-panel.module";
import { SessionService } from "./session.service";
import { ToolSelectionService } from "./tool.selection.service";
import { ToolsModule } from "./tools/tools.module";
import { VisualizationsModule } from "./visualization/visualizations.module";

@NgModule({
  imports: [VisualizationsModule, ToolsModule, DatasetModule, SessionPanelModule, DialogModalModule, LabelsModule],
  providers: [
    SessionEventService,
    SessionDataService,
    GetSessionDataService,
    QuerySessionDataService,
    SessionService,
    UploadService,
    SelectionHandlerService,
    ToolSelectionService,
    JobService,
    ModifiedSessionGuard,
    UserEventService,
    DatasetService,
  ],
})
export class SessionModule {}
