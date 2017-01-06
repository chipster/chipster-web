import { NgModule } from '@angular/core';
import {DatasetParameterListComponent} from "./dataset-parameter-list/dataset-parameter-list.component";
import {DatasetDetailsComponent} from "./datasetdetails.component";
import {SingleDatasetComponent} from "./singledataset/singledataset.component";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";

@NgModule({
  imports: [  CommonModule, FormsModule, SharedModule ],
  declarations: [DatasetDetailsComponent, DatasetParameterListComponent, SingleDatasetComponent]
})
export class DatasetModule { }
