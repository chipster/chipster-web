import { NgModule } from "@angular/core";
import { VisualizationsModule } from "./visualization/visualizations.module";
import { ToolsModule } from "./tools/tools.module";
import { DatasetModule } from "./selectiondetails/dataset.module";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../shared/shared.module";
import { SessionPanelModule } from "./session-panel/session-panel.module";
import { SessionEventService } from "./sessionevent.service";
import { SessionDataService } from "./sessiondata.service";
import { SessionListComponent } from "../session-list.component";
import { SessionComponent } from "./session.component";
import { OpenSessionFileComponent } from "../opensessionfile/opensessionfile.component";
import { UploadService } from "../../../shared/services/upload.service";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SelectionHandlerService } from "./selection-handler.service";
import { ToolSelectionService } from "./tool.selection.service";
import { JobErrorModalComponent } from "./joberrormodal/joberrormodal.component";
import { DialogModalModule } from "./dialogmodal/dialogmodal.module";
import { ModifiedSessionGuard } from "./modified-session.guard";
import { JobService } from "./job.service";
import { AngularSplitModule } from "angular-split";

@NgModule({
  imports: [
    CommonModule,
    VisualizationsModule,
    ToolsModule,
    DatasetModule,
    SharedModule,
    SessionPanelModule,
    NgbModule,
    DialogModalModule,
    AngularSplitModule
  ],
  declarations: [
    SessionComponent,
    SessionListComponent,
    OpenSessionFileComponent,
    JobErrorModalComponent
  ],
  providers: [
    SessionEventService,
    SessionDataService,
    UploadService,
    SelectionHandlerService,
    ToolSelectionService,
    JobService,
    ModifiedSessionGuard
  ],
  entryComponents: [JobErrorModalComponent]
})
export class SessionModule {}
