import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { DatasetDetailsComponent } from "./datasetdetails/datasetdetails.component";
import { JobComponent } from "./job/job.component";
import { DatasetHistorymodalComponent } from "./datasethistorymodal/datasethistorymodal.component";
import { DatasetModalService } from "./datasetmodal.service";
import { LinkButtonModule } from "../link-button/link-button.module";
import { FileComponent } from "./file/file.component";
import { VisualizationsModule } from "../visualization/visualizations.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

@NgModule({
  imports: [
    NgbModule,
    CommonModule,
    FormsModule,
    SharedModule,
    LinkButtonModule,
    VisualizationsModule
  ],
  declarations: [
    DatasetDetailsComponent,
    FileComponent,
    JobComponent,
    DatasetHistorymodalComponent
  ],
  exports: [JobComponent, FileComponent, DatasetDetailsComponent],
  providers: [DatasetModalService],
  entryComponents: [DatasetHistorymodalComponent]
})
export class DatasetModule { }
