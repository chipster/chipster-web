import { NgModule } from '@angular/core';
import {DatasetParameterListComponent} from "./dataset-parameter-list/dataset-parameter-list.component";
import {SingleDatasetComponent} from "./singledataset/singledataset.component";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {DatasetDetailsComponent} from "./datasetdetails/datasetdetails.component";
import {JobComponent} from "./job/job.component";
import { DatasetHistorymodalComponent } from './datasethistorymodal/datasethistorymodal.component';
import {DatasetModalService} from "./datasetmodal.service";
import {LinkButtonModule} from "../link-button/link-button.module";

@NgModule({
  imports: [  CommonModule, FormsModule, SharedModule, LinkButtonModule ],
  declarations: [DatasetDetailsComponent, DatasetParameterListComponent, SingleDatasetComponent, JobComponent, DatasetHistorymodalComponent],
  exports: [JobComponent, DatasetDetailsComponent, SingleDatasetComponent],
  providers: [DatasetModalService],
  entryComponents: [DatasetHistorymodalComponent]
})
export class DatasetModule { }
