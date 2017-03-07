
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

@NgModule({
  imports: [CommonModule, VisualizationsModule, ToolsModule, DatasetModule, SharedModule, LeftPanelModule, NgbModule],
  declarations: [SessionComponent, SessionListComponent, OpenSessionFile],
  providers: [SessionEventService, SessionDataService, UploadService, SelectionHandlerService]
})
export class SessionModule{}

