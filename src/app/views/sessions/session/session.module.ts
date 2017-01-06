
import {NgModule} from "@angular/core";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {JobComponent} from "./job/job.component";
import {ToolsModule} from "./tools/tools.module";
import {DatasetModule} from "./datasetdetails/dataset.module";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../shared/shared.module";

@NgModule({
  imports: [CommonModule, VisualizationsModule, ToolsModule, DatasetModule, SharedModule],
  declarations: [JobComponent],
  providers: []
})
export class SessionModule{}

