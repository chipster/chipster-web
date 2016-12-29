
import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {VisualizationsModule} from "./visualization/visualizations.module";
import {JobComponent} from "./job/job.component";

@NgModule({
  imports: [BrowserModule, VisualizationsModule],
  declarations: [JobComponent],
  providers: []
})
export class SessionModule{}
