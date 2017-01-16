
import {NgModule} from "@angular/core";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {ToolsModule} from "./tools/tools.module";
import {DatasetModule} from "./selectiondetails/dataset.module";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../shared/shared.module";
import {LeftPanelModule} from "./leftpanel/leftpanel.module";
import SessionEventService from "./sessionevent.service";

@NgModule({
  imports: [CommonModule, VisualizationsModule, ToolsModule, DatasetModule, SharedModule, LeftPanelModule],
  declarations: [],
  providers: [SessionEventService]
})
export class SessionModule{}

