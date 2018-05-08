import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AdminComponent} from "./admin.component";
import {StatisticsComponent} from "./statistics/statistics.component";
import {ServicesComponent} from "./services/services.component";
import {StorageComponent} from "./storage/storage.component";
import {JobsComponent} from "./jobs/jobs.component";
import {ClientsComponent} from "./clients/clients.component";
import {HistoryComponent} from "./history/history.component";
import {AdminRoutingModule} from "./admin-routing.module";
import { UsersComponent } from './users/users.component';
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {SharedModule} from "../../shared/shared.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {JobOutputModalComponent} from "./history/joboutputmodal.component";


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NgbModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule

  ],
  declarations: [
    AdminComponent, ServicesComponent, ClientsComponent, StorageComponent, JobsComponent,
     HistoryComponent, StatisticsComponent, UsersComponent, JobOutputModalComponent
  ],
  entryComponents: [JobOutputModalComponent]
})
export class AdminModule { }
