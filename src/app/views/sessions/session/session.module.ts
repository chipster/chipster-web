import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { AgGridModule } from "ag-grid-angular";
import { AngularSplitModule } from "angular-split";
import { UploadService } from "../../../shared/services/upload.service";
import { SharedModule } from "../../../shared/shared.module";
import { ImportSessionModalComponent } from "../open-session-file/import-session-modal.component";
import { OpenSessionFileComponent } from "../open-session-file/open-session-file.component";
import { SessionListComponent } from "../session-list.component";
import { UserEventService } from "../user-event.service";
import { DatasetService } from "./dataset.service";
import { DialogModalModule } from "./dialogmodal/dialogmodal.module";
import { GetSessionDataService } from "./get-session-data.service";
import { JobErrorModalComponent } from "./job-error-modal/job-error-modal.component";
import { JobService } from "./job.service";
import { ModifiedSessionGuard } from "./modified-session.guard";
import { QuerySessionDataService } from "./query-session-data.service";
import { SelectionHandlerService } from "./selection-handler.service";
import { SelectionPanelComponent } from "./selection-panel/selection-panel.component";
import { DatasetModule } from "./selectiondetails/dataset.module";
import { SessionDataService } from "./session-data.service";
import { SessionDetailsComponent } from "./session-details/session-details.component";
import { SessionEventService } from "./session-event.service";
import { SessionPanelModule } from "./session-panel/session-panel.module";
import { SessionComponent } from "./session.component";
import { SessionService } from "./session.service";
import { ToolSelectionService } from "./tool.selection.service";
import { ToolsModule } from "./tools/tools.module";
import { VisualizationsModule } from "./visualization/visualizations.module";
import { WrangleModalComponent } from "./wrangle-modal/wrangle-modal.component";

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
    RouterModule,
    AgGridModule,
    FormsModule,
    NgSelectModule
  ],
  declarations: [
    SessionComponent,
    SessionListComponent,
    OpenSessionFileComponent,
    JobErrorModalComponent,
    SelectionPanelComponent,
    ImportSessionModalComponent,
    SessionDetailsComponent,
    WrangleModalComponent
  ],
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
    DatasetService
  ],
  entryComponents: [
    JobErrorModalComponent,
    ImportSessionModalComponent,
    WrangleModalComponent
  ]
})
export class SessionModule {}
