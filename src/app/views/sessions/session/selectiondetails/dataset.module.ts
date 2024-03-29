import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../../../shared/shared.module";
import { LinkButtonModule } from "../link-button/link-button.module";
import { VisualizationsModule } from "../visualization/visualizations.module";
import { DatasetDetailsComponent } from "./dataset-details/dataset-details.component";
import { DatasetHistoryModalComponent } from "./dataset-history-modal/dataset-history-modal.component";
import { DatasetModalService } from "./datasetmodal.service";
import { JobComponent } from "./job/job.component";
import { FileComponent } from "./selected-files/selected-files.component";

@NgModule({
  imports: [NgbModule, CommonModule, FormsModule, SharedModule, LinkButtonModule, VisualizationsModule],
  declarations: [DatasetDetailsComponent, FileComponent, JobComponent, DatasetHistoryModalComponent],
  exports: [JobComponent, FileComponent, DatasetDetailsComponent],
  providers: [DatasetModalService],
})
export class DatasetModule {}
