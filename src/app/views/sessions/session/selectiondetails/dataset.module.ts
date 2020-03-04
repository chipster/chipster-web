import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../../../shared/shared.module";
import { LinkButtonModule } from "../link-button/link-button.module";
import { VisualizationsModule } from "../visualization/visualizations.module";
import { DatasetDetailsComponent } from "./dataset-details/dataset-details.component";
import { DatasetHistorymodalComponent } from "./dataset-history-modal/dataset-history-modal.component";
import { DatasetModalService } from "./datasetmodal.service";
import { FileComponent } from "./file/file.component";
import { JobComponent } from "./job/job.component";

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
export class DatasetModule {}
