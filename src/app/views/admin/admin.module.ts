import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../../shared/shared.module";
import { AdminRoutingModule } from "./admin-routing.module";
import { AdminComponent } from "./admin.component";
import { ClientsComponent } from "./clients/clients.component";
import { HistoryComponent } from "./history/history.component";
import { JobOutputModalComponent } from "./history/joboutputmodal.component";
import { JobsComponent } from "./jobs/jobs.component";
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { ServicesComponent } from "./services/services.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { StorageComponent } from "./storage/storage.component";
import { UsersComponent } from "./users/users.component";

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
    AdminComponent,
    ServicesComponent,
    ClientsComponent,
    StorageComponent,
    JobsComponent,
    HistoryComponent,
    StatisticsComponent,
    UsersComponent,
    JobOutputModalComponent,
    MaintenanceComponent
  ],
  entryComponents: [JobOutputModalComponent]
})
export class AdminModule {}
