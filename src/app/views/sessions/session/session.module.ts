import { NgModule } from "@angular/core";
import { VisualizationsModule } from "./visualization/visualizations.module";
import { ToolsModule } from "./tools/tools.module";
import { DatasetModule } from "./selectiondetails/dataset.module";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../shared/shared.module";
import { SessionPanelModule } from "./session-panel/session-panel.module";
import { SessionEventService } from "./session-event.service";
import { SessionDataService } from "./session-data.service";
import { SessionListComponent } from "../session-list.component";
import { SessionComponent } from "./session.component";
import { OpenSessionFileComponent } from "../open-session-file/open-session-file.component";
import { UploadService } from "../../../shared/services/upload.service";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SelectionHandlerService } from "./selection-handler.service";
import { ToolSelectionService } from "./tool.selection.service";
import { JobErrorModalComponent } from "./joberrormodal/joberrormodal.component";
import { DialogModalModule } from "./dialogmodal/dialogmodal.module";
import { ModifiedSessionGuard } from "./modified-session.guard";
import { JobService } from "./job.service";
import { AngularSplitModule } from "angular-split";
import { SelectionPanelComponent } from "./selection-panel/selection-panel.component";
import { ImportSessionModalComponent } from "../open-session-file/import-session-modal.component";
import { SessionService } from "./session.service";
import { SessionDetailsComponent } from "./session-details/session-details.component";
import { UserEventService } from "../user-event.service";
import { RouterModule } from "@angular/router";

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
    AngularSplitModule,
    RouterModule
  ],
  declarations: [
    SessionComponent,
    SessionListComponent,
    OpenSessionFileComponent,
    JobErrorModalComponent,
    SelectionPanelComponent,
    ImportSessionModalComponent,
    SessionDetailsComponent
  ],
  providers: [
    SessionEventService,
    SessionDataService,
    SessionService,
    UploadService,
    SelectionHandlerService,
    ToolSelectionService,
    JobService,
    ModifiedSessionGuard,
    UserEventService
  ],
  entryComponents: [JobErrorModalComponent, ImportSessionModalComponent]
})
export class SessionModule {}
