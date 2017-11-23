
import {NgModule} from "@angular/core";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {ToolsModule} from "./tools/tools.module";
import {DatasetModule} from "./selectiondetails/dataset.module";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../shared/shared.module";
import {LeftPanelModule} from "./leftpanel/leftpanel.module";
import {SessionEventService} from "./sessionevent.service";
import {SessionDataService} from "./sessiondata.service";
import {SessionListComponent} from "../sessionlist.component";
import {SessionComponent} from "./session.component";
import {OpenSessionFile} from "../opensessionfile/opensessionfile.component";
import {UploadService} from "../../../shared/services/upload.service";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {SelectionHandlerService} from "./selection-handler.service";
import {ToolSelectionService} from "./tool.selection.service";
import {JobErrorModalComponent} from "./joberrormodal/joberrormodal.component";
import {DialogModalModule} from "./dialogmodal/dialogmodal.module";
import {SplitPaneModule} from "ng2-split-pane/lib/ng2-split-pane";

@NgModule({
  imports: [
    CommonModule, VisualizationsModule, ToolsModule, DatasetModule, SharedModule, LeftPanelModule,
    NgbModule, DialogModalModule, SplitPaneModule],
  declarations: [
    SessionComponent,
    SessionListComponent,
    OpenSessionFile,
    JobErrorModalComponent],
  providers: [SessionEventService, SessionDataService, UploadService, SelectionHandlerService, ToolSelectionService],
  entryComponents: [JobErrorModalComponent]
})
export class SessionModule{}

