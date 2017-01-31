import { NgModule } from '@angular/core';
import {DatasetParameterListComponent} from "./dataset-parameter-list/dataset-parameter-list.component";
import {SingleDatasetComponent} from "./singledataset/singledataset.component";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {DatasetDetailsComponent} from "./datasetdetails/datasetdetails.component";
import {JobComponent} from "./job/job.component";

@NgModule({
  imports: [  CommonModule, FormsModule, SharedModule ],
  declarations: [DatasetDetailsComponent, DatasetParameterListComponent, SingleDatasetComponent, JobComponent],
  exports: [JobComponent, DatasetDetailsComponent, SingleDatasetComponent]
})
export class DatasetModule { }
