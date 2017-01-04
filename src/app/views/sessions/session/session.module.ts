
import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {JobComponent} from "./job/job.component";
import {DatasetDetailsComponent} from "./datasetdetails/datasetdetails.component";
import { DatasetParameterListComponent } from './datasetdetails/dataset-parameter-list/dataset-parameter-list.component';
import { ToolListItemComponent } from './tools/toolsmodal/tool-list-item/tool-list-item.component';

@NgModule({
  imports: [BrowserModule, VisualizationsModule],
  declarations: [JobComponent, DatasetDetailsComponent, DatasetParameterListComponent, ToolListItemComponent],
  providers: []
})
export class SessionModule{}
