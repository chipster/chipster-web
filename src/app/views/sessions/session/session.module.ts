
import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {JobComponent} from "./job/job.component";
import {DatasetDetailsComponent} from "./datasetdetails/datasetdetails.component";

@NgModule({
  imports: [BrowserModule, VisualizationsModule],
  declarations: [JobComponent, DatasetDetailsComponent],
  providers: []
})
export class SessionModule{}
